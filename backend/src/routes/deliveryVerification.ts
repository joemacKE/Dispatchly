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
   * GENERATE DELIVERY QR
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
                  code:"UNAUTHORIZED",
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
                  code:"FORBIDDEN",
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


      /*
       * Only create QR if one does not exist.
       * Prevents invalidating already issued customer QR codes.
       */

      const existing =
        await db.query(
          `
          SELECT
            delivery_qr_token
          FROM delivery_requests
          WHERE id=$1
          `,
          [
            id,
          ]
        );


      if (
        !existing.rowCount
      ) {

        return reply
          .status(404)
          .send({
            success:false,

            error:{
              code:"DELIVERY_NOT_FOUND",
              message:
                "Delivery request not found",
            },
          });

      }


      let token =
        existing.rows[0]
          .delivery_qr_token;


      if (!token) {

        token =
          generateDeliveryQrToken(
            id
          );


        await db.query(
          `
          UPDATE delivery_requests

          SET
            delivery_qr_token=$1,
            updated_at=NOW()

          WHERE id=$2

          `,
          [
            token,
            id,
          ]
        );

      }



      const result =
        await db.query(
          `
          SELECT
            payment_method,
            payment_status,
            payment_amount

          FROM delivery_requests

          WHERE id=$1

          `,
          [
            id,
          ]
        );



      return reply.send({

        success:true,

        delivery_id:id,

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
   * VERIFY DELIVERY QR
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
              code:"UNAUTHORIZED",
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
              code:"FORBIDDEN",
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
          scanned_delivery_qr_token?: string;
          version?: number;
        };



      const scannedToken =
        body.scanned_delivery_qr_token
          ?.trim();



      if (!scannedToken) {

        return reply
          .status(422)
          .send({
            success:false,

            error:{
              code:
                "INVALID_QR_PAYLOAD",

              message:
                "Scanned delivery QR token is required",
            },
          });

      }



      const client =
        await db.connect();



      try {

        await client.query(
          "BEGIN"
        );



        const delivery =
          await client.query(
            `
            SELECT *

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

          await client.query(
            "ROLLBACK"
          );


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



        const record =
          delivery.rows[0];



        if (
          record.delivery_qr_used_at
        ) {

          await client.query(
            "ROLLBACK"
          );


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




        if (
          record.delivery_qr_token !== scannedToken
        ) {


          await client.query(
            "ROLLBACK"
          );


          return reply
            .status(403)
            .send({
              success:false,

              error:{
                code:
                  "INVALID_DELIVERY_QR",

                message:
                  "The scanned QR code does not match this delivery",
              },
            });

        }





        const result =
          await client.query(
            `
            UPDATE delivery_requests

            SET

              status='delivered',

              delivery_qr_used_at=NOW(),

              delivery_qr_token=NULL,

              payment_status =
              CASE
                WHEN payment_method='cash_on_delivery'
                THEN 'paid'
                ELSE payment_status
              END,

              version=version+1,

              updated_at=NOW()


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


        request.log.error(
          error
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