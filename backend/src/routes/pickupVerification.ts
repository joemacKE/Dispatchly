import type {
  FastifyInstance,
} from "fastify";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db";

import {
  pickupQrMatches,
} from "../security/pickupQr";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};

const paramsSchema =
  z.object({
    id:
      z.string().uuid(),
  });

const pickupSchema =
  z.object({
    scanned_pickup_qr_token:
      z.string()
        .min(32),

    version:
      z.number()
        .int()
        .positive(),

    client_event_id:
      z.string()
        .uuid(),

    lat:
      z.number()
        .min(-90)
        .max(90)
        .optional(),

    lng:
      z.number()
        .min(-180)
        .max(180)
        .optional(),
  });

async function authenticate(
  request: any,
  reply: any
) {
  try {
    await request.jwtVerify();
  } catch {
    return reply
      .status(401)
      .send({
        success: false,

        error: {
          code:
            "UNAUTHORIZED",

          message:
            "A valid access token is required",
        },
      });
  }
}

export default async function pickupVerificationRoutes(
  app: FastifyInstance
) {
  /*
   * ========================================================
   * RETAILER:
   * DISPLAY PICKUP QR
   * ========================================================
   */

  app.get(
    "/delivery-requests/:id/pickup-qr",

    {
      preHandler:
        authenticate,
    },

    async (
      request,
      reply
    ) => {
      const user =
        request.user as AuthUser;

      if (
        user.role !==
        "retailer"
      ) {
        return reply
          .status(403)
          .send({
            success: false,

            error: {
              code:
                "FORBIDDEN",

              message:
                "Only the retailer can display the pickup QR code",
            },
          });
      }

      const parsedParams =
        paramsSchema.safeParse(
          request.params
        );

      if (
        !parsedParams.success
      ) {
        return reply
          .status(422)
          .send({
            success: false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid delivery request ID",
            },
          });
      }

      const deliveryId =
        parsedParams.data.id;

      const result =
        await db.query(
          `
            SELECT
              dr.id,
              dr.status,
              dr.version,
              dr.pickup_qr_token,
              dr.pickup_qr_used_at,
              a.rider_id

            FROM delivery_requests dr

            LEFT JOIN assignments a
              ON
                a.delivery_request_id =
                  dr.id

                AND
                a.is_current =
                  TRUE

            WHERE dr.id = $1
              AND dr.business_id = $2

            LIMIT 1;
          `,
          [
            deliveryId,
            user.business_id,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return reply
          .status(404)
          .send({
            success: false,

            error: {
              code:
                "DELIVERY_NOT_FOUND",

              message:
                "Delivery request not found",
            },
          });
      }

      const delivery =
        result.rows[0];

      if (
        delivery.status !==
        "assigned"
      ) {
        return reply
          .status(409)
          .send({
            success: false,

            error: {
              code:
                "INVALID_DELIVERY_STATE",

              message:
                "Pickup QR is available only while the delivery is assigned",
            },
          });
      }

      if (
        !delivery.rider_id
      ) {
        return reply
          .status(409)
          .send({
            success: false,

            error: {
              code:
                "NO_RIDER_ASSIGNED",

              message:
                "No rider is currently assigned to this delivery",
            },
          });
      }

      if (
        delivery.pickup_qr_used_at
      ) {
        return reply
          .status(409)
          .send({
            success: false,

            error: {
              code:
                "PICKUP_ALREADY_VERIFIED",

              message:
                "Pickup has already been verified",
            },
          });
      }

      if (
        !delivery.pickup_qr_token
      ) {
        return reply
          .status(409)
          .send({
            success: false,

            error: {
              code:
                "PICKUP_QR_UNAVAILABLE",

              message:
                "Pickup QR has not been generated",
            },
          });
      }

      return reply.send({
        success: true,

        delivery_id:
          delivery.id,

        version:
          delivery.version,

        pickup_qr_token:
          delivery.pickup_qr_token,
      });
    }
  );

  /*
   * ========================================================
   * RIDER:
   * VERIFY PICKUP
   * ========================================================
   */

  app.post(
    "/delivery-requests/:id/pickup",

    {
      preHandler:
        authenticate,
    },

    async (
      request,
      reply
    ) => {
      const user =
        request.user as AuthUser;

      if (
        user.role !==
        "rider"
      ) {
        return reply
          .status(403)
          .send({
            success: false,

            error: {
              code:
                "FORBIDDEN",

              message:
                "Only riders can verify pickup",
            },
          });
      }

      const parsedParams =
        paramsSchema.safeParse(
          request.params
        );

      if (
        !parsedParams.success
      ) {
        return reply
          .status(422)
          .send({
            success: false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid delivery request ID",
            },
          });
      }

      const parsedBody =
        pickupSchema.safeParse(
          request.body
        );

      if (
        !parsedBody.success
      ) {
        return reply
          .status(422)
          .send({
            success: false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid pickup verification request",

              details:
                parsedBody.error.flatten(),
            },
          });
      }

      const deliveryId =
        parsedParams.data.id;

      const {
        scanned_pickup_qr_token,
        version,
        client_event_id,
        lat,
        lng,
      } =
        parsedBody.data;

      const client =
        await db.connect();

      try {
        await client.query(
          "BEGIN"
        );

        /*
         * ---------------------------------------------------
         * Idempotency
         * ---------------------------------------------------
         */
        const duplicateResult =
          await client.query(
            `
              SELECT
                delivery_request_id,
                actor_user_id,
                to_status

              FROM status_events

              WHERE client_event_id =
                    $1

              LIMIT 1;
            `,
            [
              client_event_id,
            ]
          );

        if (
          duplicateResult.rows
            .length > 0
        ) {
          const duplicate =
            duplicateResult.rows[0];

          /*
           * Same event retried:
           * return success.
           *
           * Same UUID used for something
           * different:
           * reject it.
           */
          if (
            duplicate
              .delivery_request_id !==
              deliveryId ||
            duplicate.actor_user_id !==
              user.sub ||
            duplicate.to_status !==
              "in_transit"
          ) {
            await client.query(
              "ROLLBACK"
            );

            return reply
              .status(409)
              .send({
                success: false,

                error: {
                  code:
                    "IDEMPOTENCY_KEY_REUSED",

                  message:
                    "Client event ID has already been used for another action",
                },
              });
          }

          const current =
            await client.query(
              `
                SELECT
                  id,
                  status,
                  version

                FROM delivery_requests

                WHERE id = $1
                  AND business_id = $2

                LIMIT 1;
              `,
              [
                deliveryId,
                user.business_id,
              ]
            );

          await client.query(
            "COMMIT"
          );

          return reply.send({
            success: true,

            idempotent: true,

            pickup_verified:
              true,

            delivery:
              current.rows[0] ??
              null,
          });
        }

        /*
         * ---------------------------------------------------
         * Lock delivery
         * ---------------------------------------------------
         */
        const deliveryResult =
          await client.query(
            `
              SELECT
                dr.id,
                dr.business_id,
                dr.status,
                dr.version,
                dr.pickup_qr_token,
                dr.pickup_qr_used_at,
                a.rider_id

              FROM delivery_requests dr

              LEFT JOIN assignments a
                ON
                  a.delivery_request_id =
                    dr.id

                  AND
                  a.is_current =
                    TRUE

              WHERE dr.id = $1

              FOR UPDATE OF dr;
            `,
            [
              deliveryId,
            ]
          );

        if (
          deliveryResult.rows
            .length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(404)
            .send({
              success: false,

              error: {
                code:
                  "DELIVERY_NOT_FOUND",

                message:
                  "Delivery request not found",
              },
            });
        }

        const delivery =
          deliveryResult.rows[0];

        /*
         * Same-business security boundary.
         */
        if (
          delivery.business_id !==
          user.business_id
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(403)
            .send({
              success: false,

              error: {
                code:
                  "FORBIDDEN",

                message:
                  "Delivery belongs to another business",
              },
            });
        }

        /*
         * Only the CURRENT assigned rider
         * may scan this pickup QR.
         */
        if (
          delivery.rider_id !==
          user.sub
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(403)
            .send({
              success: false,

              error: {
                code:
                  "NOT_ASSIGNED_RIDER",

                message:
                  "This delivery is not currently assigned to you",
              },
            });
        }

        /*
         * Pickup must occur from assigned.
         */
        if (
          delivery.status !==
          "assigned"
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(409)
            .send({
              success: false,

              error: {
                code:
                  "INVALID_DELIVERY_STATE",

                message:
                  "Delivery is not awaiting pickup",

                current_status:
                  delivery.status,

                current_version:
                  delivery.version,
              },
            });
        }

        /*
         * Optimistic locking.
         */
        if (
          delivery.version !==
          version
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(409)
            .send({
              success: false,

              error: {
                code:
                  "STALE_VERSION",

                message:
                  "Delivery changed since it was loaded",

                current_status:
                  delivery.status,

                current_version:
                  delivery.version,
              },
            });
        }

        if (
          delivery.pickup_qr_used_at
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(409)
            .send({
              success: false,

              error: {
                code:
                  "PICKUP_ALREADY_VERIFIED",

                message:
                  "Pickup has already been verified",
              },
            });
        }

        /*
         * Cryptographically compare the scanned
         * credential with this delivery's pickup
         * credential.
         */
        if (
          !delivery.pickup_qr_token ||
          !pickupQrMatches(
            delivery.pickup_qr_token,
            scanned_pickup_qr_token
          )
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(403)
            .send({
              success: false,

              error: {
                code:
                  "INVALID_PICKUP_QR",

                message:
                  "Pickup QR is invalid for this delivery",
              },
            });
        }

        /*
         * ---------------------------------------------------
         * Verified custody transition
         * ---------------------------------------------------
         *
         * assigned -> in_transit
         *
         * No manual Confirm Pickup.
         * No manual Start Delivery.
         */
        const updateResult =
          await client.query(
            `
              UPDATE delivery_requests

              SET
                status =
                  'in_transit',

                version =
                  version + 1,

                pickup_qr_used_at =
                  NOW(),

                /*
                 * Destroy the credential after
                 * successful verification.
                 */
                pickup_qr_token =
                  NULL,

                updated_at =
                  NOW()

              WHERE id = $1
                AND business_id = $2
                AND version = $3
                AND status =
                  'assigned'

              RETURNING
                id,
                status,
                version,
                pickup_qr_used_at,
                updated_at;
            `,
            [
              deliveryId,
              user.business_id,
              version,
            ]
          );

        if (
          updateResult.rows
            .length !== 1
        ) {
          await client.query(
            "ROLLBACK"
          );

          return reply
            .status(409)
            .send({
              success: false,

              error: {
                code:
                  "CONCURRENT_UPDATE",

                message:
                  "Delivery changed during pickup verification",
              },
            });
        }

        /*
         * Immutable chain-of-custody event.
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
              client_event_id,
              client_occurred_at
            )

            VALUES (
              $1,
              $2,
              'assigned',
              'in_transit',
              'Pickup QR verified; rider custody confirmed',
              $3,
              $4,
              $5,
              NOW()
            );
          `,
          [
            deliveryId,
            user.sub,
            lat ?? null,
            lng ?? null,
            client_event_id,
          ]
        );

        /*
         * Administrative audit record.
         */
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
              'pickup_qr_verified',
              $3::jsonb
            );
          `,
          [
            deliveryId,
            user.sub,

            JSON.stringify({
              from_status:
                "assigned",

              to_status:
                "in_transit",

              pickup_verified:
                true,
            }),
          ]
        );

        await client.query(
          "COMMIT"
        );

        return reply.send({
          success: true,

          pickup_verified:
            true,

          delivery:
            updateResult.rows[0],
        });
      } catch (error) {
        try {
          await client.query(
            "ROLLBACK"
          );
        } catch {
          // Ignore rollback failure.
        }

        request.log.error(
          {
            err: error,
          },
          "Failed to verify pickup"
        );

        return reply
          .status(500)
          .send({
            success: false,

            error: {
              code:
                "PICKUP_VERIFICATION_FAILED",

              message:
                "Unable to verify pickup",
            },
          });
      } finally {
        client.release();
      }
    }
  );
}