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
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch {
          return reply.status(401).send({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "A valid access token is required",
            },
          });
        }

        const user = request.user as AuthUser;

        if (user.role !== "dispatcher") {
          return reply.status(403).send({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only dispatchers can list riders",
            },
          });
        }
      },
    },
    async (request, reply) => {
      const user = request.user as AuthUser;

      const result = await db.query(
        `
        SELECT
          id,
          name,
          phone,
          is_active,
          created_at
        FROM users
        WHERE business_id = $1
          AND role = 'rider'
          AND is_active = TRUE
        ORDER BY name ASC
        `,
        [user.business_id]
      );

      return reply.send({
        success: true,
        count: result.rows.length,
        riders: result.rows,
      });
    }
  );
}