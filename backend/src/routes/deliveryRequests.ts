import { FastifyInstance } from "fastify";
import { createHmac, randomUUID } from "crypto";
import { z } from "zod";

import { db } from "../config/db";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};


const createDeliverySchema = z.object({

  customer_name:
    z.string()
      .trim()
      .min(2)
      .max(120),

  customer_phone:
    z.string()
      .trim()
      .min(7)
      .max(30),

  customer_address:
    z.string()
      .trim()
      .min(3)
      .max(500),

  item_description:
    z.string()
      .trim()
      .min(2)
      .max(1000),

  payment_method:
    z.enum([
      "prepaid",
      "cash_on_delivery",
    ]),

  payment_amount:
    z.number()
      .positive()
      .optional(),

});


export default async function deliveryRequestsRoutes(
  app: FastifyInstance
) {


  /*
   * ==========================================================
   * CREATE DELIVERY REQUEST
   * ==========================================================
   */

  app.post(
    "/delivery-requests",

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

                success:false,

                error:{
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
            user.role !== "retailer"
          ) {

            return reply
              .status(403)
              .send({

                success:false,

                error:{
                  code:
                    "FORBIDDEN",

                  message:
                    "Only retailer users can create delivery requests",
                },

              });

          }

        },
    },


    async (
      request,
      reply
    ) => {


      const parsedBody =
        createDeliverySchema.safeParse(
          request.body
        );


      if (
        !parsedBody.success
      ) {

        return reply
          .status(422)
          .send({

            success:false,

            error:{
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid delivery request",

              details:
                parsedBody.error.flatten(),
            },

          });

      }



      const user =
        request.user as AuthUser;



      const {
        customer_name,
        customer_phone,
        customer_address,
        item_description,
        payment_method,
        payment_amount,

      } = parsedBody.data;



      const deliveryId =
        randomUUID();


      const clientEventId =
        randomUUID();



      const qrSecret =
        process.env.QR_SECRET;



      if (!qrSecret) {

        request.log.error(
          "QR_SECRET is not configured"
        );


        return reply
          .status(500)
          .send({

            success:false,

            error:{
              code:
                "SERVER_CONFIGURATION_ERROR",

              message:
                "QR signing is not configured",
            },

          });

      }



      /*
       * Original delivery QR token.
       *
       * Kept for compatibility.
       */

      const qrToken =
        createHmac(
          "sha256",
          qrSecret
        )
        .update(deliveryId)
        .digest("hex");



      const paymentStatus =
        payment_method === "prepaid"
          ? "paid"
          : "pending";



      const client =
        await db.connect();



      try {

        await client.query(
          "BEGIN"
        );



        const deliveryResult =
          await client.query(

            `
            INSERT INTO delivery_requests (

              id,

              business_id,

              created_by_user_id,

              customer_name,

              customer_phone,

              customer_address,

              item_description,

              status,

              qr_token,

              payment_method,

              payment_status,

              payment_amount,

              version

            )

            VALUES (

              $1,

              $2,

              $3,

              $4,

              $5,

              $6,

              $7,

              'pending',

              $8,

              $9,

              $10,

              $11,

              1

            )


            RETURNING

              id,

              business_id,

              created_by_user_id,

              customer_name,

              customer_phone,

              customer_address,

              item_description,

              status,

              payment_method,

              payment_status,

              payment_amount,

              version,

              created_at,

              updated_at

            `,

            [

              deliveryId,

              user.business_id,

              user.sub,

              customer_name,

              customer_phone,

              customer_address,

              item_description,

              qrToken,

              payment_method,

              paymentStatus,

              payment_amount ?? null,

            ]

          );



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

            NULL,

            'pending',

            'Delivery request created',

            $3

          )
          `,

          [

            deliveryId,

            user.sub,

            clientEventId,

          ]

        );



        await client.query(
          "COMMIT"
        );



        return reply
          .status(201)
          .send({

            success:true,

            delivery:
              deliveryResult.rows[0],

          });



      } catch(error) {


        await client.query(
          "ROLLBACK"
        );


        request.log.error(
          {
            err:error,
          },

          "Failed to create delivery request"
        );



        return reply
          .status(500)
          .send({

            success:false,

            error:{
              code:
                "DELIVERY_CREATION_FAILED",

              message:
                "Unable to create delivery request",
            },

          });


      } finally {

        client.release();

      }

    }

  );



  /*
   * ==========================================================
   * LIST DELIVERY REQUESTS
   * ==========================================================
   */


  app.get(

    "/delivery-requests",

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

                success:false,

                error:{
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
            ![
              "dispatcher",
              "retailer",
            ].includes(
              user.role
            )
          ) {


            return reply
              .status(403)
              .send({

                success:false,

                error:{
                  code:
                    "FORBIDDEN",

                  message:
                    "Only retailer and dispatcher users can view delivery requests",
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



      const query =
        request.query as {
          status?: string;
        };



      const allowedStatuses = [

        "pending",

        "assigned",

        "picked_up",

        "in_transit",

        "delivered",

        "cancelled",

      ];



      if (
        query.status &&
        !allowedStatuses.includes(
          query.status
        )
      ) {

        return reply
          .status(422)
          .send({

            success:false,

            error:{
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid delivery status",
            },

          });

      }



      const values: unknown[] =
        [
          user.business_id,
        ];



      let sql = `

        SELECT

          dr.id,

          dr.customer_name,

          dr.customer_phone,

          dr.customer_address,

          dr.item_description,

          dr.status,

          dr.payment_method,

          dr.payment_status,

          dr.payment_amount,

          dr.version,

          dr.created_at,

          dr.updated_at,


          a.rider_id,

          a.assigned_at,


          rider.name AS rider_name,

          rider.phone AS rider_phone


        FROM delivery_requests dr


        LEFT JOIN assignments a

          ON a.delivery_request_id = dr.id

          AND a.is_current = TRUE


        LEFT JOIN users rider

          ON rider.id = a.rider_id


        WHERE dr.business_id = $1

      `;



      if (
        query.status
      ) {

        values.push(
          query.status
        );


        sql += `

          AND dr.status =
          $2::delivery_status

        `;

      }



      sql += `

        ORDER BY dr.created_at DESC

        LIMIT 100

      `;



      const result =
        await db.query(
          sql,
          values
        );



      return reply.send({

        success:true,

        count:
          result.rows.length,

        deliveries:
          result.rows,

      });


    }

  );

}