import type {
  FastifyInstance,
} from "fastify";

import {
  z,
} from "zod";

import {
  db,
} from "../config/db";

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

const updateStatusSchema =
  z.object({
    to_status:
      z.enum([
        "picked_up",
        "in_transit",
      ]),

    version:
      z.number()
        .int()
        .positive(),

    client_event_id:
      z.string()
        .uuid()
        .optional(),

    note:
      z.string()
        .trim()
        .max(500)
        .optional(),

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
      preHandler:
        async (
          request,
          reply
        ) => {
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
                    "Only riders can access rider deliveries",
                },
              });
          }
        },
    },

    async (
      request,
      reply
    ) => {
      const user =
        request.user as AuthUser;

      const result =
        await db.query(
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
              ON dr.id =
                   a.delivery_request_id

            WHERE a.rider_id = $1
              AND a.is_current = TRUE
              AND dr.business_id = $2

              /*
               * Keep picked_up here temporarily
               * for compatibility with any
               * legacy records created before
               * Checkpoint 16.
               */
              AND dr.status IN (
                'assigned',
                'picked_up',
                'in_transit'
              )

            ORDER BY
              a.assigned_at DESC;
          `,
          [
            user.sub,
            user.business_id,
          ]
        );

      return reply.send({
        success: true,

        count:
          result.rows.length,

        deliveries:
          result.rows,
      });
    }
  );

  /*
   * ==========================================================
   * LEGACY MANUAL STATUS ENDPOINT
   * ==========================================================
   *
   * Checkpoint 16 intentionally blocks the old workflow:
   *
   * assigned -> picked_up
   * picked_up -> in_transit
   *
   * Pickup is now verified exclusively through:
   *
   * POST /delivery-requests/:id/pickup
   *
   * after scanning the retailer's pickup QR.
   *
   * We keep this route temporarily so older frontend/PWA
   * clients receive a clear business-rule error instead of
   * silently bypassing verified custody.
   */

  app.post(
    "/delivery-requests/:id/status",

    {
      preHandler:
        async (
          request,
          reply
        ) => {
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
                    "Only riders can update delivery status",
                },
              });
          }
        },
    },

    async (
      request,
      reply
    ) => {
      /*
       * Preserve request validation so malformed
       * legacy clients still receive the correct
       * validation response.
       */

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
        updateStatusSchema.safeParse(
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
                "Invalid status update",

              details:
                parsedBody.error.flatten(),
            },
          });
      }

      /*
       * SECURITY GATE
       *
       * There is intentionally no database status
       * mutation in this endpoint anymore.
       *
       * Neither picked_up nor in_transit can be
       * self-reported by the rider.
       */

      return reply
        .status(409)
        .send({
          success: false,

          error: {
            code:
              "PICKUP_QR_REQUIRED",

            message:
              "Pickup must be verified by scanning the retailer pickup QR code",
          },
        });
    }
  );
}
