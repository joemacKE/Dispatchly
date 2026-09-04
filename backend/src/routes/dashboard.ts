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
  app:FastifyInstance,
){



  /*
   * ==========================================================
   * DASHBOARD STATISTICS
   * ==========================================================
   */


  app.get(

    "/dashboard/stats",

    async(
      request,
      reply,
    )=>{


      await request.jwtVerify();



      const user =
        request.user as AuthUser;





      const result =
  await db.query(
    `
    SELECT

      COUNT(*) FILTER(
        WHERE status = 'pending'::delivery_status
      )::int AS pending,


      COUNT(*) FILTER(
        WHERE status = 'assigned'::delivery_status
      )::int AS assigned,


      COUNT(*) FILTER(
        WHERE status IN(
          'picked_up'::delivery_status,
          'in_transit'::delivery_status
        )
      )::int AS in_transit,


      COUNT(*) FILTER(
        WHERE status = 'delivered'::delivery_status
      )::int AS delivered


    FROM delivery_requests


    WHERE business_id=$1

    `,
    [
      user.business_id,
    ],
  );





      return reply.send({

        success:true,

        stats:result.rows[0],

      });


    },

  );









  /*
   * ==========================================================
   * DASHBOARD ORDERS
   * ==========================================================
   */



  app.get(

    "/dashboard/orders",

    async(
      request,
      reply,
    )=>{


      await request.jwtVerify();



      const user =
        request.user as AuthUser;





      const {
        status,
      } =
      request.query as {

        status?:string;

      };





      let statuses:string[] | null =
        null;





      if(status==="active"){

        statuses=[

          "assigned",

          "picked_up",

          "in_transit",

        ];

      }


      else if(status){

        statuses=[status];

      }






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

  version,

  created_at,

  updated_at


    FROM delivery_requests


    WHERE business_id=$1


    AND (

      $2::text[] IS NULL

      OR status::text = ANY($2::text[])

    )


    ORDER BY created_at DESC

    `,
    [
      user.business_id,
      statuses,
    ],
  );





      return reply.send({

        success:true,

        orders:result.rows,

      });



    },

  );



}