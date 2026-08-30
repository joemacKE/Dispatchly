import type {
  FastifyInstance,
} from "fastify";

import {
  z,
} from "zod";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};

const syncEventSchema =
  z.object({
    client_event_id:
      z.string().uuid(),

    delivery_request_id:
      z.string().uuid(),

    /*
     * Retain the legacy values so older
     * installed clients receive an explicit
     * PICKUP_QR_REQUIRED response.
     */
    to_status:
      z.enum([
        "picked_up",
        "in_transit",
      ]),

    version:
      z.number()
        .int()
        .positive(),

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

    occurred_at:
      z.string()
        .datetime({
          offset: true,
        })
        .optional(),
  });

const syncSchema =
  z.object({
    events:
      z.array(
        syncEventSchema
      )
        .min(1)
        .max(50),
  });

type SyncResult = {
  client_event_id: string;

  delivery_request_id: string;

  result:
    "rejected";

  error: {
    code: string;
    message: string;
  };
};

export default async function syncRoutes(
  app: FastifyInstance
) {
  app.post(
    "/sync",

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
                    "Only riders can synchronize offline delivery events",
                },
              });
          }
        },
    },

    async (
      request,
      reply
    ) => {
      const parsed =
        syncSchema.safeParse(
          request.body
        );

      if (
        !parsed.success
      ) {
        return reply
          .status(422)
          .send({
            success: false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid sync request",

              details:
                parsed.error.flatten(),
            },
          });
      }

      /*
       * ======================================================
       * CHECKPOINT 16 SECURITY RULE
       * ======================================================
       *
       * The old offline status workflow allowed:
       *
       * assigned -> picked_up
       * picked_up -> in_transit
       *
       * Those transitions are no longer trusted.
       *
       * A rider must physically scan the retailer's
       * pickup QR while online. The server then performs:
       *
       * assigned -> in_transit
       *
       * through the dedicated pickup verification endpoint.
       *
       * Therefore queued legacy pickup/transit events are
       * explicitly rejected and NEVER touch PostgreSQL.
       */

      const results:
        SyncResult[] =
        parsed.data.events.map(
          (
            event
          ): SyncResult => ({
            client_event_id:
              event.client_event_id,

            delivery_request_id:
              event.delivery_request_id,

            result:
              "rejected",

            error: {
              code:
                "PICKUP_QR_REQUIRED",

              message:
                "Pickup verification requires an online scan of the retailer pickup QR code",
            },
          })
        );

      return reply.send({
        success: true,

        summary: {
          received:
            results.length,

          applied:
            0,

          duplicates:
            0,

          conflicts:
            0,

          rejected:
            results.length,
        },

        results,

        server_time:
          new Date()
            .toISOString(),
      });
    }
  );
}
