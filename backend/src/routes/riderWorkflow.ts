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

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateStatusSchema = z.object({
  to_status: z.enum(["picked_up", "in_transit"]),

  version: z
    .number()
    .int()
    .positive(),

  client_event_id: z
    .string()
    .uuid()
    .optional(),

  note: z
    .string()
    .trim()
    .max(500)
    .optional(),

  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional(),
});

export default async function riderWorkflowRoutes(
  app: FastifyInstance
) {
  /*
   * ==========================================================
   * GET CURRENT RIDER DELIVERIES
   * ==========================================================
   */

  app.get(
    "/riders/me/deliveries",
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

        if (user.role !== "rider") {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message:
                "Only riders can access rider deliveries",
            },
          });
        }
      },
    },
    async (request, reply) => {
      const user = request.user as AuthUser;

      const result = await db.query(
        `
        SELECT
          dr.id,
          dr.customer_name,
          dr.customer_phone,
          dr.customer_address,
          dr.item_description,
          dr.status,
          dr.version,
          dr.created_at,
          dr.updated_at,

          a.id AS assignment_id,
          a.assigned_at,
          a.is_current

        FROM assignments a

        JOIN delivery_requests dr
          ON dr.id = a.delivery_request_id

        WHERE a.rider_id = $1
          AND a.is_current = TRUE
          AND dr.business_id = $2
          AND dr.status IN (
            'assigned',
            'picked_up',
            'in_transit'
          )

        ORDER BY a.assigned_at DESC
        `,
        [
          user.sub,
          user.business_id,
        ]
      );

      return reply.send({
        success: true,
        count: result.rows.length,
        deliveries: result.rows,
      });
    }
  );

  /*
   * ==========================================================
   * UPDATE DELIVERY STATUS
   * ==========================================================
   */

  app.post(
    "/delivery-requests/:id/status",
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

        if (user.role !== "rider") {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message:
                "Only riders can update delivery status",
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

      const parsedBody = updateStatusSchema.safeParse(
        request.body
      );

      if (!parsedBody.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid status update",
            details: parsedBody.error.flatten(),
          },
        });
      }

      const user = request.user as AuthUser;

      const deliveryId = parsedParams.data.id;

      const {
        to_status,
        version,
        client_event_id,
        note,
        lat,
        lng,
      } = parsedBody.data;

      const eventId =
        client_event_id ?? randomUUID();

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        /*
         * Confirm that:
         *
         * 1. Delivery belongs to same business.
         * 2. Current assignment belongs to this rider.
         */
        const deliveryResult = await client.query(
          `
          SELECT
            dr.id,
            dr.business_id,
            dr.customer_name,
            dr.customer_phone,
            dr.customer_address,
            dr.item_description,
            dr.status,
            dr.version,
            dr.created_at,
            dr.updated_at

          FROM delivery_requests dr

          JOIN assignments a
            ON a.delivery_request_id = dr.id
            AND a.is_current = TRUE

          WHERE dr.id = $1
            AND dr.business_id = $2
            AND a.rider_id = $3

          LIMIT 1
          `,
          [
            deliveryId,
            user.business_id,
            user.sub,
          ]
        );

        if (deliveryResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return reply.status(404).send({
            success: false,
            error: {
              code: "RIDER_DELIVERY_NOT_FOUND",
              message:
                "Assigned delivery not found",
            },
          });
        }

        const currentDelivery =
          deliveryResult.rows[0];

        /*
         * If the client supplied an idempotency key,
         * check whether this event has already been
         * processed.
         */
        if (client_event_id) {
          const duplicateResult =
            await client.query(
              `
              SELECT
                delivery_request_id,
                to_status
              FROM status_events
              WHERE client_event_id = $1
              LIMIT 1
              `,
              [client_event_id]
            );

          if (
            duplicateResult.rows.length > 0
          ) {
            const existingEvent =
              duplicateResult.rows[0];

            if (
              existingEvent.delivery_request_id ===
                deliveryId &&
              existingEvent.to_status ===
                to_status
            ) {
              await client.query("ROLLBACK");

              return reply.send({
                success: true,
                idempotent: true,
                delivery: currentDelivery,
              });
            }

            await client.query("ROLLBACK");

            return reply.status(409).send({
              success: false,
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message:
                  "This client event ID has already been used",
              },
            });
          }
        }

        /*
         * Optimistic concurrency check.
         */
        if (currentDelivery.version !== version) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "STALE_VERSION",
              message:
                "Delivery has changed. Refresh and try again.",
              current_version:
                currentDelivery.version,
            },
          });
        }

        /*
         * Valid rider state transitions.
         *
         * Delivered is deliberately NOT here.
         * QR/POD will control that transition.
         */
        const allowedTransitions: Record<
          string,
          string
        > = {
          assigned: "picked_up",
          picked_up: "in_transit",
        };

        const requiredNextStatus =
          allowedTransitions[
            currentDelivery.status
          ];

        if (
          !requiredNextStatus ||
          requiredNextStatus !== to_status
        ) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code:
                "INVALID_STATUS_TRANSITION",
              message: `Cannot transition from ${currentDelivery.status} to ${to_status}`,
            },
          });
        }

        /*
         * Update current status using version
         * as optimistic-lock guard.
         */
        const updateResult =
          await client.query(
            `
            UPDATE delivery_requests

            SET
              status = $4::delivery_status,
              version = version + 1,
              updated_at = NOW()

            WHERE id = $1
              AND business_id = $2
              AND version = $3
              AND status = $5::delivery_status

            RETURNING
              id,
              business_id,
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
              to_status,
              currentDelivery.status,
            ]
          );

        if (updateResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "CONCURRENT_UPDATE",
              message:
                "Delivery changed while this update was being processed",
            },
          });
        }

        /*
         * Immutable status history.
         */
        await client.query(
          `
          INSERT INTO status_events (
            delivery_request_id,
            actor_user_id,
            from_status,
            to_status,
            note,
            lat,
            lng,
            client_event_id
          )

          VALUES (
            $1,
            $2,
            $3::delivery_status,
            $4::delivery_status,
            $5,
            $6,
            $7,
            $8
          )
          `,
          [
            deliveryId,
            user.sub,
            currentDelivery.status,
            to_status,
            note ?? null,
            lat ?? null,
            lng ?? null,
            eventId,
          ]
        );

        await client.query("COMMIT");

        return reply.send({
          success: true,
          idempotent: false,
          delivery: updateResult.rows[0],
        });
      } catch (error) {
        await client.query("ROLLBACK");

        request.log.error(
          { err: error },
          "Failed to update rider delivery status"
        );

        return reply.status(500).send({
          success: false,
          error: {
            code:
              "STATUS_UPDATE_FAILED",
            message:
              "Unable to update delivery status",
          },
        });
      } finally {
        client.release();
      }
    }
  );
}