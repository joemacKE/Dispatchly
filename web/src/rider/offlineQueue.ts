import type {
  OfflineSyncEvent,
} from "../api/client";

function key(
  riderId: string
) {
  return `reflex_offline_queue:${riderId}`;
}

export function getOfflineQueue(
  riderId: string
): OfflineSyncEvent[] {
  const raw =
    localStorage.getItem(
      key(riderId)
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(
  riderId: string,
  events: OfflineSyncEvent[]
) {
  localStorage.setItem(
    key(riderId),
    JSON.stringify(events)
  );
}

export function addOfflineEvent(
  riderId: string,
  event: OfflineSyncEvent
) {
  const current =
    getOfflineQueue(
      riderId
    );

  if (
    current.some(
      (item) =>
        item.client_event_id ===
        event.client_event_id
    )
  ) {
    return current;
  }

  const next = [
    ...current,
    event,
  ];

  saveOfflineQueue(
    riderId,
    next
  );

  return next;
}

export function clearOfflineQueue(
  riderId: string
) {
  localStorage.removeItem(
    key(riderId)
  );
}