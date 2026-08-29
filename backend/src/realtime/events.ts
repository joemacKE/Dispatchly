import { redis } from "../config/redis";

export type RealtimeEventType =
  | "delivery.created"
  | "delivery.assigned"
  | "delivery.status_changed"
  | "delivery.delivered";

type RealtimeEvent = {
  type: RealtimeEventType;
  data: unknown;
};

export async function publishBusinessEvent(
  businessId: string,
  event: RealtimeEvent
) {
  const payload = {
    type: event.type,
    business_id: businessId,
    data: event.data,
    occurred_at: new Date().toISOString(),
  };

  await redis.publish(
    `business:${businessId}`,
    JSON.stringify(payload)
  );
}