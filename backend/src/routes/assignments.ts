import { FastifyInstance } from "fastify";
import { db } from "../config/db";

export default async function (app: FastifyInstance) {
  app.post("/assignments", async (req, reply) => {
    // ✅ Correct way: cast req.body instead of annotating destructure
    const body = req.body as {
      request_id: number;
      dispatcher_id: number;
      rider_id: number;
    };

    const { request_id, dispatcher_id, rider_id } = body;

    const result = await db.query(
      `INSERT INTO assignments (request_id, dispatcher_id, rider_id, assigned_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [request_id, dispatcher_id, rider_id]
    );

    return reply.send(result.rows[0]);
  });
}
