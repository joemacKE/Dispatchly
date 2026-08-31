import type {
  FastifyInstance,
} from "fastify";

import {
  createHmac,
} from "crypto";

import {
  db,
} from "../config/db";


type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
};



function generateDeliveryQrToken(
  deliveryId: string
) {
  const secret =
    process.env.QR_SECRET;


  if (!secret) {
    throw new Error(
      "QR_SECRET missing"
    );
  }


  return createHmac(
    "sha256",
    secret
  )
    .update(
      `delivery:${deliveryId}`
    )
    .digest("hex");
}



export default async function deliveryVerificationRoutes(
  app: FastifyInstance
) {


  /*
   * ==========================================================
   * GENERATE DELIVERY QR
   * ==========================================================
   *
   * Retailer generates customer delivery QR
   *
   */


  app.get(
    "/delivery-requests/:id/delivery-qr",

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
                    "Only retailers can generate delivery QR codes",
                },
              });
          }

        },
    },


    async (
      request,
      reply
    ) => {


      const {
        id,
      } =
        request.params as {
          id:string;
        };



      const token =
        generateDeliveryQrToken(
          id
        );



      const result =
        await db.query(
          `
          UPDATE delivery_requests

          SET

            delivery_qr_token = $1,

            updated_at = NOW()


          WHERE id = $2


          RETURNING

            id,

            payment_method,

            payment_status,

            payment_amount

          `,
          [
            token,
            id,
          ]
        );



      if (
        !result.rowCount
      ) {

        return reply
          .status(404)
          .send({
            success:false,

            error:{
              code:
                "DELIVERY_NOT_FOUND",

              message:
                "Delivery request not found",
            },
          });

      }



      return reply.send({

        success:true,

        delivery_id:
          id,

        delivery_qr_token:
          token,

        payment_method:
          result.rows[0]
            .payment_method,

        payment_status:
          result.rows[0]
            .payment_status,

        payment_amount:
          result.rows[0]
            .payment_amount,

      });

    }

  );



  /*
   * ==========================================================
   * VERIFY DELIVERY QR
   * ==========================================================
   *
   * Rider scans customer QR
   *
   */


  app.post(
    "/delivery-requests/:id/delivery",

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
        user.role !== "rider"
      ) {

        return reply
          .status(403)
          .send({
            success:false,

            error:{
              code:
                "FORBIDDEN",

              message:
                "Only riders can complete deliveries",
            },
          });

      }



      const {
        id,
      } =
        request.params as {
          id:string;
        };



      const body =
        request.body as {
          scanned_delivery_qr_token:string;
          version:number;
        };



      const client =
        await db.connect();



      try {

        await client.query(
          "BEGIN"
        );



        const delivery =
          await client.query(
            `
            SELECT

              *

            FROM delivery_requests

            WHERE id=$1

            FOR UPDATE

            `,
            [
              id,
            ]
          );



        if (
          !delivery.rowCount
        ) {

          throw new Error(
            "NOT_FOUND"
          );

        }



        const record =
          delivery.rows[0];



        if (
          record.delivery_qr_used_at
        ) {

          return reply
            .status(409)
            .send({
              success:false,

              error:{
                code:
                  "DELIVERY_ALREADY_COMPLETED",

                message:
                  "Delivery QR has already been used",
              },
            });

        }



        const expected =
          generateDeliveryQrToken(
            id
          );



        if (
          !record.delivery_qr_token ||
          expected !==
          body.scanned_delivery_qr_token
        ) {


          return reply
            .status(403)
            .send({
              success:false,

              error:{
                code:
                  "INVALID_DELIVERY_QR",

                message:
                  "Delivery QR is invalid for this order",
              },
            });

        }



        const result =
          await client.query(
            `
            UPDATE delivery_requests

          SET

          status =
          'delivered',

          delivery_qr_used_at =
          NOW(),

          delivery_qr_token =
          NULL,

          payment_status =
          CASE
            WHEN payment_method = 'cash_on_delivery'
            THEN 'paid'
            ELSE payment_status
          END,

          version =
          version + 1,

          updated_at =
          NOW()

          WHERE id=$1

          RETURNING *


            WHERE id=$1


            RETURNING *

            `,
            [
              id,
            ]
          );



        await client.query(
          "COMMIT"
        );



        return reply.send({

          success:true,

          delivered:true,

          delivery:
            result.rows[0],

        });


      } catch(error) {


        await client.query(
          "ROLLBACK"
        );


        return reply
          .status(500)
          .send({
            success:false,

            error:{
              code:
                "DELIVERY_VERIFICATION_FAILED",

              message:
                "Unable to verify delivery",
            },
          });


      } finally {

        client.release();

      }

    }

  );

}
