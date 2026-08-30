import Fastify from "fastify";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { db } from "./config/db";

import {
  connectRedis,
  disconnectRedis,
  redis,
} from "./config/redis";

import { env } from "./config/env";

import authRoutes from "./routes/auth";
import deliveryRequestsRoutes from "./routes/deliveryRequests";
import ridersRoutes from "./routes/riders";
import dispatchRoutes from "./routes/dispatch";
import riderWorkflowRoutes from "./routes/riderWorkflow";
import proofOfDeliveryRoutes from "./routes/proofOfDelivery";
import syncRoutes from "./routes/sync";
import pickupVerificationRoutes from "./routes/pickupVerification";

import websocketRoutes from "./realtime/websocket";

/*
 * ==========================================================
 * FASTIFY APPLICATION
 * ==========================================================
 */

const app = Fastify({
  logger: {
    level:
      env.IS_PRODUCTION
        ? "info"
        : "debug",
  },

  bodyLimit:
    1_048_576,

  trustProxy:
    env.TRUST_PROXY,
});

/*
 * ==========================================================
 * APPLICATION BOOTSTRAP
 * ==========================================================
 */

async function bootstrap() {
  try {
    /*
     * --------------------------------------------------------
     * ENVIRONMENT VALIDATION
     * --------------------------------------------------------
     */


    /*
     * --------------------------------------------------------
     * EXTERNAL INFRASTRUCTURE
     * --------------------------------------------------------
     *
     * Connect Redis before realtime subscriptions are
     * initialized.
     */

    await connectRedis();

    /*
     * --------------------------------------------------------
     * JWT
     * --------------------------------------------------------
     */

   await app.register(jwt, {
  secret:
    env.JWT_SECRET,
});

    /*
     * --------------------------------------------------------
     * WEBSOCKET INFRASTRUCTURE
     * --------------------------------------------------------
     *
     * @fastify/websocket must be registered before /ws.
     */

    await app.register(websocket);

    /*
     * --------------------------------------------------------
     * OPENAPI / SWAGGER
     * --------------------------------------------------------
     *
     * Swagger is registered before application routes so
     * those routes can be included in the OpenAPI document.
     */

    await app.register(swagger, {
      openapi: {
        info: {
          title:
            "Reflex Delivery Coordination API",

          description:
            "Backend API for retailer, dispatcher and rider delivery coordination.",

          version: "0.1.0",
        },

       servers: [
          {
            url:
              env.API_PUBLIC_URL,

            description:
              env.IS_PRODUCTION
                ? "Production"
                : "Local development",
          },
        ],

        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",

      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
    });

    /*
     * --------------------------------------------------------
     * CORS
     * --------------------------------------------------------
     */

      await app.register(cors, {
      origin:
        env.CORS_ORIGINS,

      methods: [
        "GET",
        "POST",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],
    });

    /*
     * --------------------------------------------------------
     * SECURITY HEADERS
     * --------------------------------------------------------
     *
     * CSP is temporarily disabled because Swagger UI
     * serves browser assets requiring additional CSP setup.
     */

    await app.register(helmet, {
      contentSecurityPolicy: false,
    });

    /*
     * --------------------------------------------------------
     * RATE LIMITING
     * --------------------------------------------------------
     */

    await app.register(rateLimit, {
      max: 120,
      timeWindow: "1 minute",
    });

    /*
     * ==========================================================
     * CENTRALIZED ERROR HANDLER
     * ==========================================================
     *
     * Fastify 5 + strict TypeScript may expose `error`
     * as `unknown`.
     *
     * Therefore we safely narrow only the properties
     * required by this handler.
     */
await app.register(
  pickupVerificationRoutes
);
    app.setErrorHandler(
      async (
        error,
        request,
        reply
      ) => {
        const apiError =
          error as {
            statusCode?: number;
            code?: string;
            message?: string;
          };

        const statusCode =
          typeof apiError.statusCode ===
          "number"
            ? apiError.statusCode
            : 500;

        /*
         * Always log the original error internally.
         */
        request.log.error(
          {
            err: error,
            request_id:
              request.id,
          },
          "Request failed"
        );

        /*
         * ------------------------------------------------------
         * RATE LIMIT
         * ------------------------------------------------------
         */

        if (
          statusCode === 429
        ) {
          return reply
            .status(429)
            .send({
              success: false,

              error: {
                code:
                  "RATE_LIMITED",

                message:
                  "Too many requests. Please try again later.",
              },

              request_id:
                request.id,
            });
        }

        /*
         * ------------------------------------------------------
         * PAYLOAD TOO LARGE
         * ------------------------------------------------------
         */

        if (
          apiError.code ===
          "FST_ERR_CTP_BODY_TOO_LARGE"
        ) {
          return reply
            .status(413)
            .send({
              success: false,

              error: {
                code:
                  "PAYLOAD_TOO_LARGE",

                message:
                  "Request payload is too large",
              },

              request_id:
                request.id,
            });
        }

        /*
         * ------------------------------------------------------
         * CLIENT / FRAMEWORK ERRORS
         * ------------------------------------------------------
         */

        if (
          statusCode >= 400 &&
          statusCode < 500
        ) {
          return reply
            .status(statusCode)
            .send({
              success: false,

              error: {
                code:
                  "REQUEST_ERROR",

                message:
                  apiError.message ??
                  "Request could not be processed",
              },

              request_id:
                request.id,
            });
        }

        /*
         * ------------------------------------------------------
         * INTERNAL SERVER ERRORS
         * ------------------------------------------------------
         *
         * Do not expose stack traces, SQL errors, Redis errors,
         * secrets or internal exception information.
         */

        return reply
          .status(500)
          .send({
            success: false,

            error: {
              code:
                "INTERNAL_SERVER_ERROR",

              message:
                "An unexpected server error occurred",
            },

            request_id:
              request.id,
          });
      }
    );

    /*
     * ==========================================================
     * STANDARD 404 HANDLER
     * ==========================================================
     */

    app.setNotFoundHandler(
      async (
        request,
        reply
      ) => {
        return reply
          .status(404)
          .send({
            success: false,

            error: {
              code:
                "NOT_FOUND",

              message:
                "Route not found",
            },

            request_id:
              request.id,
          });
      }
    );

    /*
     * ==========================================================
     * APPLICATION REST ROUTES
     * ==========================================================
     */

    await app.register(
      authRoutes
    );

    await app.register(
      deliveryRequestsRoutes
    );

    await app.register(
      ridersRoutes
    );

    await app.register(
      dispatchRoutes
    );

    await app.register(
      riderWorkflowRoutes
    );

    await app.register(
      proofOfDeliveryRoutes
    );

    await app.register(
      syncRoutes
    );

    /*
     * ==========================================================
     * WEBSOCKET ROUTES
     * ==========================================================
     */

    await app.register(
      websocketRoutes
    );

    /*
     * ==========================================================
     * HEALTH CHECK
     * ==========================================================
     *
     * Health checks are excluded from normal API rate limiting.
     */

    app.get(
      "/health",
      {
        config: {
          rateLimit: false,
        },
      },

      async (
        _request,
        reply
      ) => {
        try {
          const [
            databaseResult,
            redisResult,
          ] =
            await Promise.all([
              db.query(
                "SELECT NOW()"
              ),

              redis.ping(),
            ]);

          return {
            status: "ok",

            database:
              "connected",

            redis:
              redisResult ===
              "PONG"
                ? "connected"
                : "unknown",

            time:
              databaseResult
                .rows[0].now,
          };
        } catch (error) {
          app.log.error(
            {
              err: error,
            },
            "Health check failed"
          );

          return reply
            .status(503)
            .send({
              status:
                "unhealthy",

              database_or_redis:
                "unavailable",
            });
        }
      }
    );

    /*
     * ==========================================================
     * START SERVER
     * ==========================================================
     */

    const port =
  env.PORT;

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    app.log.info(
      {
        port,
      },
      "Reflex API started successfully"
    );
  } catch (error) {
    app.log.error(
      {
        err: error,
      },
      "Failed to start Reflex API"
    );

    process.exit(1);
  }
}

/*
 * ==========================================================
 * GRACEFUL SHUTDOWN
 * ==========================================================
 */

async function shutdown(
  signal: string
) {
  try {
    app.log.info(
      {
        signal,
      },
      "Shutting down Reflex API"
    );

    /*
     * Stop accepting new HTTP/WebSocket requests.
     */
    await app.close();

    /*
     * Close Redis publisher/subscriber clients.
     */
    await disconnectRedis();

    /*
     * Close PostgreSQL connection pool.
     */
    await db.end();

    app.log.info(
      "Reflex API shut down successfully"
    );

    process.exit(0);
  } catch (error) {
    app.log.error(
      {
        err: error,
      },
      "Failed during graceful shutdown"
    );

    process.exit(1);
  }
}

process.on(
  "SIGTERM",
  () => {
    void shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    void shutdown(
      "SIGINT"
    );
  }
);

/*
 * ==========================================================
 * START APPLICATION
 * ==========================================================
 */

void bootstrap();