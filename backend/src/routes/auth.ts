import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

import { db } from "../config/db";


const loginSchema =
  z.object({
    phone:
      z.string()
        .trim()
        .min(7),

    password:
      z.string()
        .min(1),
  });


export default async function authRoutes(
  app: FastifyInstance
) {

  app.post(
    "/auth/login",
    async (
      request,
      reply
    ) => {

      const parsedBody =
        loginSchema.safeParse(
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
                "Phone and password are required",

              details:
                parsedBody.error.flatten(),
            },

          });

      }


      const {
        phone,
        password,
      } =
        parsedBody.data;



      const result =
        await db.query(
          `
          SELECT
            id,
            business_id,
            name,
            phone,
            password_hash,
            role,
            is_active
          FROM users
          WHERE phone = $1
          LIMIT 1
          `,
          [
            phone,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return reply
          .status(401)
          .send({

            success:false,

            error:{
              code:
                "INVALID_CREDENTIALS",

              message:
                "Invalid phone or password",
            },

          });

      }


      const user =
        result.rows[0];


      if (
        !user.is_active
      ) {

        return reply
          .status(403)
          .send({

            success:false,

            error:{
              code:
                "ACCOUNT_DISABLED",

              message:
                "This account is disabled",
            },

          });

      }


      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (
        !passwordMatches
      ) {

        return reply
          .status(401)
          .send({

            success:false,

            error:{
              code:
                "INVALID_CREDENTIALS",

              message:
                "Invalid phone or password",
            },

          });

      }


      const accessToken =
        app.jwt.sign(

          {
            sub:
              user.id,

            business_id:
              user.business_id,

            role:
              user.role,

            name:
              user.name,
          },

          {
            expiresIn:
              "15m",
          }

        );


      return reply.send({

        success:true,

        access_token:
          accessToken,

        token_type:
          "Bearer",

        expires_in:
          900,

        user:{

          id:
            user.id,

          business_id:
            user.business_id,

          name:
            user.name,

          phone:
            user.phone,

          role:
            user.role,

        },

      });

    }
  );

}