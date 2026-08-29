import { FastifyInstance } from "fastify";
import { z } from "zod";

import { db } from "../config/db";

import {
  publishBusinessEvent,
} from "../realtime/events";

type AuthUser = {
  sub: string;
  business_id: string;
  role: string;
  name?: string;
};

const syncEventSchema = z.object({
  client_event_id: z.string().uuid(),

  delivery_request_id: z.string().uuid(),

  to_status: z.enum([
    "picked_up",
    "in_transit",
  ]),

  version: z
    .number()
    .int()
    .positive(),

  note: z
    .string()
    .trim()
    .max(500)
    .optional(),

  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional(),

  occurred_at: z
    .string()
    .datetime({ offset: true })
    .optional(),
});

const syncSchema = z.object({
  events: z
    .array(syncEventSchema)
    .min(1)
    .max(50),
});

type SyncEvent =
  z.infer<typeof syncEventSchema>;

type SyncResult = {
  client_event_id: string;
  delivery_request_id: string;
  result:
    | "applied"
    | "duplicate"
    | "conflict"
    | "rejected";

  delivery?: {
    id: string;
    status: string;
    version: number;
  };

  error?: {
    code: string;
    message: string;
    current_status?: string;
    current_version?: number;
  };
};

const allowedTransitions: Record<
  string,
  string
> = {
  assigned: "picked_up",
  picked_up: "in_transit",
};

async function processSyncEvent(
  event: SyncEvent,
  user: AuthUser,
  request: any
): Promise<SyncResult> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    /*
     * --------------------------------------------------------
     * IDEMPOTENCY
     *
     * A mobile device may retry the same event several times.
     * client_event_id guarantees it is applied only once.
     * --------------------------------------------------------
     */
    const duplicateResult =
      await client.query(
        `
        SELECT
          delivery_request_id,
          to_status
        FROM status_events
        WHERE client_event_id = $1
        LIMIT 1
        `,
        [event.client_event_id]
      );

    if (duplicateResult.rows.length > 0) {
      const existingEvent =
        duplicateResult.rows[0];

      if (
        existingEvent.delivery_request_id ===
          event.delivery_request_id &&
        existingEvent.to_status ===
          event.to_status
      ) {
        const currentResult =
          await client.query(
            `
            SELECT
              id,
              status,
              version
            FROM delivery_requests
            WHERE id = $1
              AND business_id = $2
            LIMIT 1
            `,
            [
              event.delivery_request_id,
              user.business_id,
            ]
          );

        await client.query("ROLLBACK");

        return {
          client_event_id:
            event.client_event_id,

          delivery_request_id:
            event.delivery_request_id,

          result: "duplicate",

          delivery:
            currentResult.rows[0] ??
            undefined,
        };
      }

      await client.query("ROLLBACK");

      return {
        client_event_id:
          event.client_event_id,

        delivery_request_id:
          event.delivery_request_id,

        result: "conflict",

        error: {
          code:
            "IDEMPOTENCY_KEY_REUSED",

          message:
            "This client event ID was already used for another event",
        },
      };
    }

    /*
     * --------------------------------------------------------
     * LOCK DELIVERY ROW
     *
     * FOR UPDATE prevents another transaction from modifying
     * this delivery while this offline event is reconciled.
     * --------------------------------------------------------
     */
    const deliveryResult =
      await client.query(
        `
        SELECT
          dr.id,
          dr.status,
          dr.version

        FROM delivery_requests dr

        JOIN assignments a
          ON a.delivery_request_id = dr.id
          AND a.is_current = TRUE

        WHERE dr.id = $1
          AND dr.business_id = $2
          AND a.rider_id = $3

        FOR UPDATE OF dr
        `,
        [
          event.delivery_request_id,
          user.business_id,
          user.sub,
        ]
      );

    if (deliveryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        client_event_id:
          event.client_event_id,

        delivery_request_id:
          event.delivery_request_id,

        result: "rejected",

        error: {
          code:
            "RIDER_DELIVERY_NOT_FOUND",

          message:
            "This delivery is not currently assigned to this rider",
        },
      };
    }

    const currentDelivery =
      deliveryResult.rows[0];

    /*
     * --------------------------------------------------------
     * VERSION CHECK
     * --------------------------------------------------------
     */
    if (
      currentDelivery.version !==
      event.version
    ) {
      await client.query("ROLLBACK");

      return {
        client_event_id:
          event.client_event_id,

        delivery_request_id:
          event.delivery_request_id,

        result: "conflict",

        error: {
          code: "STALE_VERSION",

          message:
            "Server delivery version differs from the offline event",

          current_status:
            currentDelivery.status,

          current_version:
            currentDelivery.version,
        },
      };
    }

    /*
     * --------------------------------------------------------
     * STATE MACHINE
     * --------------------------------------------------------
     */
    const expectedNextStatus =
      allowedTransitions[
        currentDelivery.status
      ];

    if (
      !expectedNextStatus ||
      expectedNextStatus !==
        event.to_status
    ) {
      await client.query("ROLLBACK");

      return {
        client_event_id:
          event.client_event_id,

        delivery_request_id:
          event.delivery_request_id,

        result: "conflict",

        error: {
          code:
            "INVALID_STATUS_TRANSITION",

          message:
            `Cannot transition from ${currentDelivery.status} to ${event.to_status}`,

          current_status:
            currentDelivery.status,

          current_version:
            currentDelivery.version,
        },
      };
    }

    /*
     * --------------------------------------------------------
     * UPDATE CURRENT STATE
     * --------------------------------------------------------
     */
    const updateResult =
      await client.query(
        `
        UPDATE delivery_requests

        SET
          status = $4::delivery_status,
          version = version + 1,
          updated_at = NOW()

        WHERE id = $1
          AND business_id = $2
          AND version = $3
          AND status = $5::delivery_status

        RETURNING
          id,
          status,
          version
        `,
        [
          event.delivery_request_id,
          user.business_id,
          event.version,
          event.to_status,
          currentDelivery.status,
        ]
      );

    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        client_event_id:
          event.client_event_id,

        delivery_request_id:
          event.delivery_request_id,

        result: "conflict",

        error: {
          code:
            "CONCURRENT_UPDATE",

          message:
            "Delivery changed while the offline event was being processed",
        },
      };
    }

    /*
     * --------------------------------------------------------
     * IMMUTABLE EVENT HISTORY
     * --------------------------------------------------------
     */
    await client.query(
      `
      INSERT INTO status_events (
        delivery_request_id,
        actor_user_id,
        from_status,
        to_status,
        note,
        lat,
        lng,
        client_event_id,
        client_occurred_at
      )

      VALUES (
        $1,
        $2,
        $3::delivery_status,
        $4::delivery_status,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      `,
      [
        event.delivery_request_id,
        user.sub,
        currentDelivery.status,
        event.to_status,
        event.note ?? null,
        event.lat ?? null,
        event.lng ?? null,
        event.client_event_id,
        event.occurred_at ?? null,
      ]
    );

    await client.query("COMMIT");

    const updatedDelivery =
      updateResult.rows[0];

    /*
     * A realtime failure must not undo
     * a committed database change.
     */
    publishBusinessEvent(
      user.business_id,
      {
        type:
          "delivery.status_changed",

        data: {
          delivery:
            updatedDelivery,

          from_status:
            currentDelivery.status,

          to_status:
            event.to_status,

          source:
            "offline_sync",
        },
      }
    ).catch((error) => {
      request.log.error(
        { err: error },
        "Failed to publish synced delivery event"
      );
    });

    return {
      client_event_id:
        event.client_event_id,

      delivery_request_id:
        event.delivery_request_id,

      result: "applied",

      delivery:
        updatedDelivery,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    request.log.error(
      { err: error },
      "Failed to process offline event"
    );

    return {
      client_event_id:
        event.client_event_id,

      delivery_request_id:
        event.delivery_request_id,

      result: "rejected",

      error: {
        code:
          "SYNC_EVENT_FAILED",

        message:
          "Unable to process offline event",
      },
    };
  } finally {
    client.release();
  }
}

export default async function syncRoutes(
  app: FastifyInstance
) {
  app.post(
    "/sync",
    {
      preHandler: async (
        request,
        reply
      ) => {
        try {
          await request.jwtVerify();
        } catch {
          return reply
            .status(401)
            .send({
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

        if (user.role !== "rider") {
          return reply
            .status(403)
            .send({
              success: false,

              error: {
                code: "FORBIDDEN",

                message:
                  "Only riders can synchronize offline delivery events",
              },
            });
        }
      },
    },
    async (request, reply) => {
      const parsed =
        syncSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply
          .status(422)
          .send({
            success: false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid sync request",

              details:
                parsed.error.flatten(),
            },
          });
      }

      const user =
        request.user as AuthUser;

      const results:
        SyncResult[] = [];

      /*
       * IMPORTANT:
       *
       * Process sequentially.
       *
       * If event 1 changes:
       * version 2 → 3
       *
       * event 2 may legitimately expect:
       * version 3.
       */
      for (
        const event of
        parsed.data.events
      ) {
        const result =
          await processSyncEvent(
            event,
            user,
            request
          );

        results.push(result);
      }

      const applied =
        results.filter(
          (item) =>
            item.result ===
            "applied"
        ).length;

      const duplicates =
        results.filter(
          (item) =>
            item.result ===
            "duplicate"
        ).length;

      const conflicts =
        results.filter(
          (item) =>
            item.result ===
            "conflict"
        ).length;

      const rejected =
        results.filter(
          (item) =>
            item.result ===
            "rejected"
        ).length;

      return reply.send({
        success: true,

        summary: {
          received:
            results.length,

          applied,

          duplicates,

          conflicts,

          rejected,
        },

        results,

        server_time:
          new Date().toISOString(),
      });
    }
  );
}