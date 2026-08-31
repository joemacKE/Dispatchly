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

/*
 * ==========================================================
 * LEGACY STATUS REQUEST SCHEMA
 * ==========================================================
 *
 * This endpoint is retained only for compatibility with
 * older clients.
 *
 * Riders are no longer allowed to manually update pickup
 * custody states.
 *
 * Pickup verification happens only through:
 *
 * POST /delivery-requests/:id/pickup
 *
 * after scanning the retailer QR code.
 */

const updateStatusSchema =
  z.object({
    to_status:
      z.string(),

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
            user.role !== "rider"
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
             * New custody workflow:
             *
             * assigned
             *     |
             *     | pickup QR verification
             *     v
             * in_transit
             *
             * picked_up is intentionally removed.
             */

            AND dr.status IN (
              'assigned',
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
   * This endpoint remains temporarily so older clients do
   * not silently bypass the QR custody workflow.
   *
   * Manual transitions:
   *
   * assigned -> picked_up
   * picked_up -> in_transit
   *
   * are permanently disabled.
   *
   * Correct workflow:
   *
   * assigned
   *    |
   *    | retailer pickup QR scan
   *    v
   * in_transit
   *
   * through:
   *
   * POST /delivery-requests/:id/pickup
   *
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
            user.role !== "rider"
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
       * No database update occurs here.
       *
       * Any manual rider status change is rejected.
       *
       * Pickup must be completed through QR verification.
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