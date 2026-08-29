import Fastify from "fastify";
import jwt from "@fastify/jwt";
import deliveryRequestsRoutes from "./routes/deliveryRequests";
import ridersRoutes from "./routes/riders";
import dispatchRoutes from "./routes/dispatch";
import riderWorkflowRoutes from "./routes/riderWorkflow";

import { db } from "./config/db";
import authRoutes from "./routes/auth";

const app = Fastify({
  logger: true,
});


const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

app.register(jwt, {
  secret: jwtSecret,
});

app.register(authRoutes);
app.register(deliveryRequestsRoutes);
app.register(ridersRoutes);
app.register(dispatchRoutes);
app.register(riderWorkflowRoutes);
// Health check
app.get("/health", async () => {
  const result = await db.query("SELECT NOW()");

  return {
    status: "ok",
    database: "connected",
    time: result.rows[0].now,
  };
});

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT || 3000),
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();