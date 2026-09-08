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



const registerSchema =
  z.object({

    role:
      z.enum([
        "retailer",
        "dispatcher",
        "rider",
      ]),


    business_id:
      z.string()
        .uuid()
        .optional(),


    business:
      z.object({

        name:
          z.string()
            .trim()
            .min(2),

        type:
          z.enum([
            "electronics",
            "pharmacy",
            "hardware",
            "other",
          ]),

        address:
          z.string()
            .trim()
            .min(2),

        phone:
          z.string()
            .trim()
            .min(7),

      })
      .optional(),



    name:
      z.string()
        .trim()
        .min(2),


    phone:
      z.string()
        .trim()
        .min(7),


    password:
      z.string()
        .min(8),

  });




export default async function authRoutes(
  app: FastifyInstance
) {



  /*
  ==========================================================
  LOGIN
  ==========================================================
  */


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



      if(!parsedBody.success){

        return reply
          .status(422)
          .send({

            success:false,

            error:{
              code:
                "VALIDATION_ERROR",

              message:
                "Phone and password are required",

            }

          });

      }



      const {
        phone,
        password,

      } = parsedBody.data;



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

          WHERE phone=$1

          LIMIT 1

          `,

          [
            phone
          ]

        );



      if(result.rows.length===0){

        return reply
          .status(401)
          .send({

            success:false,

            error:{
              code:
                "INVALID_CREDENTIALS",

              message:
                "Invalid phone or password"

            }

          });

      }



      const user =
        result.rows[0];



      if(!user.is_active){

        return reply
          .status(403)
          .send({

            success:false,

            error:{
              code:
                "ACCOUNT_DISABLED",

              message:
                "Account disabled"

            }

          });

      }




      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password_hash
        );



      if(!passwordMatches){

        return reply
          .status(401)
          .send({

            success:false,

            error:{
              code:
                "INVALID_CREDENTIALS",

              message:
                "Invalid phone or password"

            }

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

        }

      });


    }

  );






  /*
  ==========================================================
  REGISTER
  ==========================================================
  */


  app.post(
    "/auth/register",

    async(
      request,
      reply
    )=>{


      const parsed =
        registerSchema.safeParse(
          request.body
        );



      if(!parsed.success){

        return reply
          .status(422)
          .send({

            success:false,

            error:{
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid registration details"

            }

          });

      }



      const data =
        parsed.data;



      const client =
        await db.connect();



      try{


        await client.query(
          "BEGIN"
        );



        let businessId =
          data.business_id;



        /*
        Retailers create businesses
        */

        if(data.role==="retailer"){


          if(!data.business){

            throw new Error(
              "Business information required"
            );

          }



          const businessResult =
            await client.query(

              `
              INSERT INTO businesses
              (
                name,
                type,
                address,
                phone
              )

              VALUES
              ($1,$2,$3,$4)

              RETURNING id

              `,

              [

                data.business.name,

                data.business.type,

                data.business.address,

                data.business.phone

              ]

            );



          businessId =
            businessResult.rows[0].id;


        }




        /*
        Riders and dispatchers
        must have business
        */

        if(!businessId){

          throw new Error(
            "Business ID required"
          );

        }




        const existingUser =
          await client.query(

            `
            SELECT id
            FROM users
            WHERE phone=$1

            `,

            [
              data.phone
            ]

          );



        if(existingUser.rows.length){

          return reply
            .status(409)
            .send({

              success:false,

              error:{
                code:
                  "PHONE_EXISTS",

                message:
                  "Phone already registered"

              }

            });

        }





        const passwordHash =
          await bcrypt.hash(
            data.password,
            12
          );




        const userResult =
          await client.query(

            `
            INSERT INTO users
            (
              business_id,
              name,
              phone,
              password_hash,
              role
            )

            VALUES
            ($1,$2,$3,$4,$5::user_role)

            RETURNING

            id,
            business_id,
            name,
            phone,
            role

            `,

            [

              businessId,

              data.name,

              data.phone,

              passwordHash,

              data.role

            ]

          );





        await client.query(
          "COMMIT"
        );



        const user =
          userResult.rows[0];



        const token =
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
            token,


          token_type:
            "Bearer",


          expires_in:
            900,


          user

        });



      }catch(error){



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
                "REGISTRATION_FAILED",

              message:
                "Unable to create account"

            }

          });



      }finally{


        client.release();


      }


    }

  );


}