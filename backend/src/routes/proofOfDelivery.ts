import { FastifyInstance } from "fastify";
import { randomUUID, timingSafeEqual } from "crypto";
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

const podSchema = z.object({
  scanned_qr_token: z.string().trim().min(10),

  version: z
    .number()
    .int()
    .positive(),

  client_event_id: z
    .string()
    .uuid()
    .optional(),

  recipient_name: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  photo_url: z
    .string()
    .url()
    .optional(),

  signature_url: z
    .string()
    .url()
    .optional(),
});

function secureTokenMatch(
  expectedToken: string,
  suppliedToken: string
): boolean {
  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);

  if (expected.length !== supplied.length) {
    return false;
  }

  return timingSafeEqual(expected, supplied);
}

export default async function proofOfDeliveryRoutes(
  app: FastifyInstance
) {
  /*
   * ==========================================================
   * GET QR TOKEN
   *
   * Temporary API representation of the QR payload.
   * The frontend will later render this token as an actual QR.
   * ==========================================================
   */
  app.get(
    "/delivery-requests/:id/qr",
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

        if (
          !["retailer", "dispatcher"].includes(
            user.role
          )
        ) {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message:
                "Only retailer and dispatcher users can access delivery QR codes",
            },
          });
        }
      },
    },
    async (request, reply) => {
      const parsedParams =
        paramsSchema.safeParse(request.params);

      if (!parsedParams.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid delivery request ID",
          },
        });
      }

      const user = request.user as AuthUser;
      const deliveryId = parsedParams.data.id;

      const result = await db.query(
        `
        SELECT
          id,
          qr_token,
          status
        FROM delivery_requests
        WHERE id = $1
          AND business_id = $2
        LIMIT 1
        `,
        [
          deliveryId,
          user.business_id,
        ]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "DELIVERY_NOT_FOUND",
            message: "Delivery request not found",
          },
        });
      }

      const delivery = result.rows[0];

      return reply.send({
        success: true,
        qr: {
          delivery_id: delivery.id,
          token: delivery.qr_token,
          status: delivery.status,
        },
      });
    }
  );

  /*
   * ==========================================================
   * SUBMIT PROOF OF DELIVERY
   * ==========================================================
   */
  app.post(
    "/delivery-requests/:id/pod",
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
                "Only riders can submit proof of delivery",
            },
          });
        }
      },
    },
    async (request, reply) => {
      const parsedParams =
        paramsSchema.safeParse(request.params);

      if (!parsedParams.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid delivery request ID",
          },
        });
      }

      const parsedBody =
        podSchema.safeParse(request.body);

      if (!parsedBody.success) {
        return reply.status(422).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Invalid proof-of-delivery request",
            details:
              parsedBody.error.flatten(),
          },
        });
      }

      const user = request.user as AuthUser;

      const deliveryId =
        parsedParams.data.id;

      const {
        scanned_qr_token,
        version,
        client_event_id,
        recipient_name,
        photo_url,
        signature_url,
      } = parsedBody.data;

      const eventId =
        client_event_id ?? randomUUID();

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        /*
         * ------------------------------------------------------
         * Idempotency check
         * ------------------------------------------------------
         */
        if (client_event_id) {
          const existingEventResult =
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
            existingEventResult.rows.length > 0
          ) {
            const existingEvent =
              existingEventResult.rows[0];

            if (
              existingEvent.delivery_request_id ===
                deliveryId &&
              existingEvent.to_status ===
                "delivered"
            ) {
              const existingDeliveryResult =
                await client.query(
                  `
                  SELECT
                    id,
                    status,
                    version,
                    updated_at
                  FROM delivery_requests
                  WHERE id = $1
                    AND business_id = $2
                  LIMIT 1
                  `,
                  [
                    deliveryId,
                    user.business_id,
                  ]
                );

              const existingPodResult =
                await client.query(
                  `
                  SELECT
                    id,
                    delivery_request_id,
                    recipient_name,
                    photo_url,
                    signature_url,
                    created_at
                  FROM proof_of_delivery
                  WHERE delivery_request_id = $1
                  LIMIT 1
                  `,
                  [deliveryId]
                );

              await client.query("ROLLBACK");

              return reply.send({
                success: true,
                idempotent: true,
                delivery:
                  existingDeliveryResult.rows[0],
                proof_of_delivery:
                  existingPodResult.rows[0],
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
         * ------------------------------------------------------
         * Load delivery and prove it belongs to this rider.
         * ------------------------------------------------------
         */
        const deliveryResult =
          await client.query(
            `
            SELECT
              dr.id,
              dr.business_id,
              dr.customer_name,
              dr.customer_phone,
              dr.customer_address,
              dr.item_description,
              dr.status,
              dr.qr_token,
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

        if (
          deliveryResult.rows.length === 0
        ) {
          await client.query("ROLLBACK");

          return reply.status(404).send({
            success: false,
            error: {
              code:
                "RIDER_DELIVERY_NOT_FOUND",
              message:
                "Assigned delivery not found",
            },
          });
        }

        const currentDelivery =
          deliveryResult.rows[0];

        /*
         * ------------------------------------------------------
         * Version check
         * ------------------------------------------------------
         */
        if (
          currentDelivery.version !== version
        ) {
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
         * ------------------------------------------------------
         * Only IN_TRANSIT may become DELIVERED.
         * ------------------------------------------------------
         */
        if (
          currentDelivery.status !==
          "in_transit"
        ) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code:
                "INVALID_DELIVERY_STATE",
              message:
                "Only an in-transit delivery can be completed",
            },
          });
        }

        /*
         * ------------------------------------------------------
         * QR token validation
         * ------------------------------------------------------
         */
        const tokenMatches =
          secureTokenMatch(
            currentDelivery.qr_token,
            scanned_qr_token
          );

        if (!tokenMatches) {
          await client.query("ROLLBACK");

          return reply.status(422).send({
            success: false,
            error: {
              code: "INVALID_QR_TOKEN",
              message:
                "The scanned QR code does not match this delivery",
            },
          });
        }

        /*
         * ------------------------------------------------------
         * Make sure POD doesn't already exist.
         * ------------------------------------------------------
         */
        const existingPod =
          await client.query(
            `
            SELECT id
            FROM proof_of_delivery
            WHERE delivery_request_id = $1
            LIMIT 1
            `,
            [deliveryId]
          );

        if (existingPod.rows.length > 0) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "POD_ALREADY_EXISTS",
              message:
                "Proof of delivery has already been recorded",
            },
          });
        }

        /*
         * ------------------------------------------------------
         * Optimistic-lock update.
         *
         * This is the real concurrency guard.
         * ------------------------------------------------------
         */
        const updateResult =
          await client.query(
            `
            UPDATE delivery_requests

            SET
              status = 'delivered',
              version = version + 1,
              updated_at = NOW()

            WHERE id = $1
              AND business_id = $2
              AND version = $3
              AND status = 'in_transit'

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
            ]
          );

        if (
          updateResult.rows.length === 0
        ) {
          await client.query("ROLLBACK");

          return reply.status(409).send({
            success: false,
            error: {
              code: "CONCURRENT_UPDATE",
              message:
                "Delivery changed while proof of delivery was being processed",
            },
          });
        }

        /*
         * ------------------------------------------------------
         * Store proof.
         * ------------------------------------------------------
         */
        const podResult =
          await client.query(
            `
            INSERT INTO proof_of_delivery (
              delivery_request_id,
              scanned_qr_token,
              photo_url,
              recipient_name,
              signature_url
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )

            RETURNING
              id,
              delivery_request_id,
              recipient_name,
              photo_url,
              signature_url,
              created_at
            `,
            [
              deliveryId,
              scanned_qr_token,
              photo_url ?? null,
              recipient_name ?? null,
              signature_url ?? null,
            ]
          );

        /*
         * ------------------------------------------------------
         * Immutable delivery event.
         * ------------------------------------------------------
         */
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
            'in_transit',
            'delivered',
            'Proof of delivery verified',
            $3
          )
          `,
          [
            deliveryId,
            user.sub,
            eventId,
          ]
        );

        await client.query("COMMIT");

        return reply.send({
          success: true,
          idempotent: false,
          delivery:
            updateResult.rows[0],
          proof_of_delivery:
            podResult.rows[0],
        });
      } catch (error) {
        await client.query("ROLLBACK");

        request.log.error(
          { err: error },
          "Failed to submit proof of delivery"
        );

        return reply.status(500).send({
          success: false,
          error: {
            code: "POD_SUBMISSION_FAILED",
            message:
              "Unable to submit proof of delivery",
          },
        });
      } finally {
        client.release();
      }
    }
  );
}
