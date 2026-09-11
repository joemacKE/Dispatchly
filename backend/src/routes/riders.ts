import { FastifyInstance } from "fastify";

import { db } from "../config/db";


type AuthUser = {
  sub: string;

  business_id: string;

  role: string;

  name?: string;
};



export default async function ridersRoutes(
  app: FastifyInstance
) {

  app.get(
    "/riders",

    {
      preHandler: async (
        request,
        reply
      ) => {

        try {

          await request.jwtVerify();

        } catch {

          return reply.status(401).send({

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
          user.role !== "dispatcher"
        ) {

          return reply.status(403).send({

            success: false,

            error: {

              code:
                "FORBIDDEN",

              message:
                "Only dispatchers can list riders",

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

            u.id,

            u.name,

            u.phone,

            u.is_active,


            COUNT(dr.id)
              FILTER (

                WHERE a.is_current = TRUE

                AND dr.status IN (

                  'assigned',

                  'in_transit'

                )

              ) AS active_deliveries


          FROM users u



          LEFT JOIN assignments a

            ON u.id = a.rider_id



          LEFT JOIN delivery_requests dr

            ON dr.id =
               a.delivery_request_id



          WHERE u.business_id = $1

            AND u.role = 'rider'

            AND u.is_active = TRUE



          GROUP BY

            u.id,

            u.name,

            u.phone,

            u.is_active



          ORDER BY

            u.name ASC

          `,

          [
            user.business_id
          ]

        );



      const MAX_ACTIVE_DELIVERIES = 3;



      const riders =
        result.rows.map(
          (rider) => {

            const activeDeliveries =
              Number(
                rider.active_deliveries ?? 0
              );



            return {

              ...rider,


              active_deliveries:
                activeDeliveries,


              availability:

                activeDeliveries <
                MAX_ACTIVE_DELIVERIES

                  ? "available"

                  : "busy",

            };

          }

        );



      return reply.send({

        success: true,

        count:
          riders.length,

        riders,

      });


    }

  );

}