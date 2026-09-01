import type {
  FastifyInstance,
} from "fastify";

import {
  db,
} from "../config/db";


type AuthUser = {
  sub:string;
  business_id:string;
  role:string;
};



export default async function dashboardRoutes(
  app: FastifyInstance
) {


  /*
   * ==========================================================
   * RETAILER DASHBOARD STATISTICS
   * ==========================================================
   */


  app.get(
    "/dashboard/stats",

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
                "Only retailers can access dashboard statistics",
            },
          });

      }



      const result =
        await db.query(
          `
          SELECT

          COUNT(*) AS total,

          COUNT(*) FILTER(
            WHERE status='pending'
          ) AS pending,


          COUNT(*) FILTER(
            WHERE status IN(
              'assigned',
              'picked_up',
              'in_transit'
            )
          ) AS active,


          COUNT(*) FILTER(
            WHERE status='picked_up'
          ) AS picked_up,


          COUNT(*) FILTER(
            WHERE status='delivered'
          ) AS delivered,


          COUNT(*) FILTER(
            WHERE status='failed'
          ) AS failed


          FROM delivery_requests

          WHERE business_id=$1

          `,
          [
            user.business_id,
          ]
        );



      return reply.send({

        success:true,

        stats:
          result.rows[0],

      });


    }

  );





  /*
   * ==========================================================
   * FILTER ORDERS
   * ==========================================================
   *
   * Example:
   *
   * GET /dashboard/orders?status=in_transit
   *
   */


  app.get(
    "/dashboard/orders",

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



      if(
        user.role !== "retailer"
      ){

        return reply
          .status(403)
          .send({
            success:false,

            error:{
              code:"FORBIDDEN",
              message:
                "Only retailers can access orders",
            },
          });

      }



      const {
        status,
      } =
      request.query as {
        status?:string;
      };



      const result =
        await db.query(
          `
          SELECT

            id,

            customer_name,

            customer_phone,

            customer_address,

            item_description,

            status,

            payment_method,

            payment_status,

            payment_amount,

            created_at,

            updated_at


          FROM delivery_requests


          WHERE business_id=$1


          AND (
            $2::text IS NULL
            OR status=$2
          )


          ORDER BY created_at DESC

          `,
          [
            user.business_id,

            status || null,
          ]
        );



      return reply.send({

        success:true,

        orders:
          result.rows,

      });


    }

  );


}