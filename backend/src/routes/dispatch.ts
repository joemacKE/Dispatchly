import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";

import { db } from "../config/db";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};

const assignSchema = z.object({
  rider_id: z.string().uuid(),
  version: z.number().int().positive(),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export default async function dispatchRoutes(
  app: FastifyInstance
) {
  app.post(
    "/delivery-requests/:id/assign",
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch {
          return reply.status(401).send({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "A valid access token is required",
            },
          });
        }

        const user = request.user as AuthUser;

        if (user.role !== "dispatcher") {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only dispatchers can assign riders",
            },
          });
        }
      },
    },
    async (request, reply) => {
      const parsedParams = paramsSchema.safeParse(
        request.params
      );

      if (!parsedParams.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid delivery request ID",
          },
        });
      }

      const parsedBody = assignSchema.safeParse(
        request.body
      );

      if (!parsedBody.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid assignment request",
            details: parsedBody.error.flatten(),
          },
        });
      }

      const user = request.user as AuthUser;

      const deliveryId = parsedParams.data.id;
      const { rider_id, version } = parsedBody.data;

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        // Make sure the rider exists, is active,
        // and belongs to this dispatcher’s business.
        const riderResult = await client.query(
          `
          SELECT id, name, phone
          FROM users
          WHERE id = $1
            AND business_id = $2
            AND role = 'rider'
            AND is_active = TRUE
          LIMIT 1
          `,
          [rider_id, user.business_id]
        );

        if (riderResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return reply.status(404).send({
            success: false,
            error: {
              code: "RIDER_NOT_FOUND",
              message: "Active rider not found",
            },
          });
        }

        // Read current delivery state.
        const currentResult = await client.query(
          `
          SELECT
            id,
            status,
            version
          FROM delivery_requests
          WHERE id = $1
            AND business_id = $2
          LIMIT 1
          `,
          [deliveryId, user.business_id]
        );

        if (currentResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return reply.status(404).send({
            success: false,
            error: {
              code: "DELIVERY_NOT_FOUND",
              message: "Delivery request not found",
            },
          });
        }

        const currentDelivery = currentResult.rows[0];

        if (currentDelivery.version !== version) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "STALE_VERSION",
              message:
                "Delivery has been changed. Refresh and try again.",
              current_version:
                currentDelivery.version,
            },
          });
        }

        if (
          !["pending", "assigned"].includes(
            currentDelivery.status
          )
        ) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "INVALID_DELIVERY_STATE",
              message:
                "This delivery can no longer be assigned",
            },
          });
        }

        /*
         * This UPDATE is our real optimistic-lock guard.
         *
         * Even if another dispatcher changed the row
         * after our SELECT above, this UPDATE succeeds
         * only if the version still matches.
         */
        const updateResult = await client.query(
          `
          UPDATE delivery_requests
          SET
            status = 'assigned',
            version = version + 1,
            updated_at = NOW()
          WHERE id = $1
            AND business_id = $2
            AND version = $3
            AND status IN ('pending', 'assigned')
          RETURNING
            id,
            customer_name,
            customer_phone,
            customer_address,
            item_description,
            status,
            version,
            created_at,
            updated_at
          `,
          [
            deliveryId,
            user.business_id,
            version,
          ]
        );

        if (updateResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "CONCURRENT_UPDATE",
              message:
                "Another dispatcher changed this delivery. Refresh and try again.",
            },
          });
        }

        // Close any previous current assignment.
        await client.query(
          `
          UPDATE assignments
          SET
            is_current = FALSE,
            unassigned_at = NOW()
          WHERE delivery_request_id = $1
            AND is_current = TRUE
          `,
          [deliveryId]
        );

        // Create current assignment.
        const assignmentResult = await client.query(
          `
          INSERT INTO assignments (
            delivery_request_id,
            rider_id,
            assigned_by_user_id,
            is_current
          )
          VALUES ($1, $2, $3, TRUE)
          RETURNING
            id,
            delivery_request_id,
            rider_id,
            assigned_by_user_id,
            assigned_at,
            is_current
          `,
          [
            deliveryId,
            rider_id,
            user.sub,
          ]
        );

        // Only create a status transition when
        // pending actually becomes assigned.
        if (currentDelivery.status === "pending") {
          await client.query(
            `
            INSERT INTO status_events (
              delivery_request_id,
              actor_user_id,
              from_status,
              to_status,
              note,
              client_event_id
            )
            VALUES (
              $1,
              $2,
              'pending',
              'assigned',
              'Delivery assigned to rider',
              $3
            )
            `,
            [
              deliveryId,
              user.sub,
              randomUUID(),
            ]
          );
        } else {
          // Reassignment doesn't change delivery status,
          // so record it in the audit log instead.
          await client.query(
            `
            INSERT INTO audit_log (
              entity_type,
              entity_id,
              actor_user_id,
              action,
              diff
            )
            VALUES (
              'delivery_request',
              $1,
              $2,
              'rider_reassigned',
              $3::jsonb
            )
            `,
            [
              deliveryId,
              user.sub,
              JSON.stringify({
                rider_id,
              }),
            ]
          );
        }

        await client.query("COMMIT");

        return reply.send({
          success: true,
          delivery: updateResult.rows[0],
          assignment: {
            ...assignmentResult.rows[0],
            rider: riderResult.rows[0],
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");

        request.log.error(
          { err: error },
          "Failed to assign delivery"
        );

        return reply.status(500).send({
          success: false,
          error: {
            code: "ASSIGNMENT_FAILED",
            message: "Unable to assign delivery",
          },
        });
      } finally {
        client.release();
      }
    }
  );
}