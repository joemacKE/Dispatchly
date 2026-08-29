import Fastify from "fastify";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";

import { db } from "./config/db";

import {
  connectRedis,
  disconnectRedis,
  redis,
} from "./config/redis";

import authRoutes from "./routes/auth";
import deliveryRequestsRoutes from "./routes/deliveryRequests";
import ridersRoutes from "./routes/riders";
import dispatchRoutes from "./routes/dispatch";
import riderWorkflowRoutes from "./routes/riderWorkflow";
import proofOfDeliveryRoutes from "./routes/proofOfDelivery";

import websocketRoutes from "./realtime/websocket";

const app = Fastify({
  logger: true,
});

async function bootstrap() {
  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET environment variable is required"
      );
    }

    await app.register(jwt, {
      secret: jwtSecret,
    });

    await app.register(websocket);

    await app.register(authRoutes);
    await app.register(deliveryRequestsRoutes);
    await app.register(ridersRoutes);
    await app.register(dispatchRoutes);
    await app.register(riderWorkflowRoutes);
    await app.register(proofOfDeliveryRoutes);

    await app.register(websocketRoutes);

    app.get("/health", async (_, reply) => {
      try {
        const [
          databaseResult,
          redisResult,
        ] = await Promise.all([
          db.query("SELECT NOW()"),
          redis.ping(),
        ]);

        return {
          status: "ok",
          database: "connected",
          redis:
            redisResult === "PONG"
              ? "connected"
              : "unknown",
          time:
            databaseResult.rows[0].now,
        };
      } catch (error) {
        app.log.error(
          { err: error },
          "Health check failed"
        );

        return reply.status(503).send({
          status: "unhealthy",
          database_or_redis:
            "unavailable",
        });
      }
    });

    await connectRedis();

    await app.listen({
      port: Number(
        process.env.PORT || 3000
      ),
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await app.close();
    await disconnectRedis();
    await db.end();

    process.exit(0);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

bootstrap();