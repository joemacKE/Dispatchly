import { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import { redisSubscriber } from "../config/redis";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};

type AuthMessage = {
  type?: string;
  token?: string;
};

const businessSockets =
  new Map<string, Set<WebSocket>>();

let subscriberStarted = false;

function addSocket(
  businessId: string,
  socket: WebSocket
) {
  let sockets =
    businessSockets.get(businessId);

  if (!sockets) {
    sockets = new Set<WebSocket>();

    businessSockets.set(
      businessId,
      sockets
    );
  }

  sockets.add(socket);
}

function removeSocket(
  businessId: string,
  socket: WebSocket
) {
  const sockets =
    businessSockets.get(businessId);

  if (!sockets) {
    return;
  }

  sockets.delete(socket);

  if (sockets.size === 0) {
    businessSockets.delete(
      businessId
    );
  }
}

function startRedisSubscription(
  app: FastifyInstance
) {
  if (subscriberStarted) {
    return;
  }

  /*
   * Mark it started before launching the async
   * subscription so Fastify cannot accidentally
   * start duplicate subscriptions.
   */
  subscriberStarted = true;

  /*
   * IMPORTANT:
   *
   * Do not await this inside the Fastify plugin.
   * The WebSocket route must finish registering
   * immediately.
   */
  void redisSubscriber
    .pSubscribe(
      "business:*",
      (message, channel) => {
        const prefix = "business:";

        if (!channel.startsWith(prefix)) {
          return;
        }

        const businessId =
          channel.slice(prefix.length);

        const sockets =
          businessSockets.get(
            businessId
          );

        if (!sockets) {
          return;
        }

        for (const socket of sockets) {
          if (socket.readyState === 1) {
            socket.send(message);
          }
        }
      }
    )
    .then(() => {
      app.log.info(
        "Redis realtime subscriber ready"
      );
    })
    .catch((error) => {
      subscriberStarted = false;

      app.log.error(
        { err: error },
        "Failed to start Redis realtime subscriber"
      );
    });
}

export default async function websocketRoutes(
  app: FastifyInstance
) {
  /*
   * Start Redis subscription without blocking
   * Fastify plugin registration.
   */
  startRedisSubscription(app);

  /*
   * WebSocket endpoint.
   */
  app.get(
    "/ws",
    {
      websocket: true,
    },
    (socket) => {
      let authenticatedUser:
        | AuthUser
        | null = null;

      /*
       * A client gets five seconds to
       * authenticate after connecting.
       */
      const authenticationTimeout =
        setTimeout(() => {
          if (!authenticatedUser) {
            socket.close(
              4401,
              "Authentication required"
            );
          }
        }, 5000);

      /*
       * Attach message listener immediately.
       */
      socket.on(
        "message",
        (rawMessage) => {
          let message: AuthMessage;

          try {
            message = JSON.parse(
              rawMessage.toString()
            );
          } catch {
            socket.send(
              JSON.stringify({
                type: "error",
                error: {
                  code: "INVALID_MESSAGE",
                  message:
                    "Messages must be valid JSON",
                },
              })
            );

            return;
          }

          /*
           * The first useful message must
           * authenticate the connection.
           */
          if (!authenticatedUser) {
            if (
              message.type !== "auth" ||
              !message.token
            ) {
              socket.send(
                JSON.stringify({
                  type:
                    "authentication.error",
                  error: {
                    code:
                      "AUTHENTICATION_REQUIRED",
                    message:
                      "Authenticate before using this connection",
                  },
                })
              );

              return;
            }

            try {
              const user =
                app.jwt.verify<AuthUser>(
                  message.token
                );

              if (
                !user.sub ||
                !user.business_id ||
                !user.role
              ) {
                throw new Error(
                  "Invalid token payload"
                );
              }

              authenticatedUser = user;

              addSocket(
                user.business_id,
                socket
              );

              clearTimeout(
                authenticationTimeout
              );

              socket.send(
                JSON.stringify({
                  type:
                    "authentication.success",
                  user: {
                    id: user.sub,
                    business_id:
                      user.business_id,
                    role: user.role,
                    name: user.name,
                  },
                })
              );
            } catch {
              socket.send(
                JSON.stringify({
                  type:
                    "authentication.error",
                  error: {
                    code:
                      "INVALID_TOKEN",
                    message:
                      "Invalid or expired access token",
                  },
                })
              );

              socket.close(
                4401,
                "Invalid token"
              );
            }

            return;
          }

          /*
           * Heartbeat.
           */
          if (message.type === "ping") {
            socket.send(
              JSON.stringify({
                type: "pong",
                time:
                  new Date().toISOString(),
              })
            );

            return;
          }

          socket.send(
            JSON.stringify({
              type: "error",
              error: {
                code:
                  "UNKNOWN_MESSAGE_TYPE",
                message:
                  "Unknown WebSocket message type",
              },
            })
          );
        }
      );

      socket.on("close", () => {
        clearTimeout(
          authenticationTimeout
        );

        if (authenticatedUser) {
          removeSocket(
            authenticatedUser.business_id,
            socket
          );
        }
      });

      socket.on("error", (error) => {
        app.log.error(
          { err: error },
          "WebSocket connection error"
        );
      });
    }
  );
}