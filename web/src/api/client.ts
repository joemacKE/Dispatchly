import type {
  ApiErrorResponse,
  Delivery,
  LoginResponse,
  Rider,
} from "../types";

/*
 * ==========================================================
 * API CONFIGURATION
 * ==========================================================
 */

const configuredApiUrl =
  import.meta.env
    .VITE_API_URL
    ?.trim();

/*
 * Production must explicitly provide the public
 * HTTPS backend URL.
 */
if (
  import.meta.env.PROD &&
  !configuredApiUrl
) {
  throw new Error(
    "VITE_API_URL is required for production builds"
  );
}

/*
 * Production API traffic must use HTTPS.
 *
 * This also means our WebSocket connection will be
 * converted from https:// to wss:// by the dashboard.
 */
if (
  import.meta.env.PROD &&
  configuredApiUrl &&
  !configuredApiUrl.startsWith(
    "https://"
  )
) {
  throw new Error(
    "Production VITE_API_URL must use HTTPS"
  );
}

export const API_URL =
  (
    configuredApiUrl ||
    "http://localhost:8000"
  ).replace(/\/+$/, "");

/*
 * ==========================================================
 * SHARED RESPONSE HANDLING
 * ==========================================================
 */

async function parseResponse<T>(
  response: Response
): Promise<T> {
  let data: unknown;

  /*
   * Some failure responses may not contain JSON.
   */
  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "Server returned an invalid response"
        : `Request failed (${response.status})`
    );
  }

  if (!response.ok) {
    const apiError =
      data as ApiErrorResponse;

    throw new Error(
      apiError.error?.message ||
        `Request failed (${response.status})`
    );
  }

  return data as T;
}

/*
 * ==========================================================
 * AUTHENTICATION
 * ==========================================================
 */

export async function login(
  phone: string,
  password: string
) {
  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            phone,
            password,
          }),
      }
    );

  return parseResponse<LoginResponse>(
    response
  );
}

/*
 * ==========================================================
 * RETAILER / DISPATCHER
 * ==========================================================
 */

export async function getDeliveries(
  token: string
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return parseResponse<{
    success: boolean;
    count: number;
    deliveries: Delivery[];
  }>(response);
}

export async function createDelivery(
  token: string,
  payload: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    item_description: string;
  }
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return parseResponse<{
    success: boolean;
    delivery: Delivery;
  }>(response);
}

export async function getRiders(
  token: string
) {
  const response =
    await fetch(
      `${API_URL}/riders`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return parseResponse<{
    success: boolean;
    count: number;
    riders: Rider[];
  }>(response);
}

export async function assignDelivery(
  token: string,
  deliveryId: string,
  riderId: string,
  version: number
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests/${deliveryId}/assign`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            rider_id:
              riderId,

            version,
          }),
      }
    );

  return parseResponse<{
    success: boolean;
    delivery?: Delivery;
  }>(response);
}

/*
 * ==========================================================
 * DELIVERY QR
 * ==========================================================
 */

export async function getDeliveryQr(
  token: string,
  deliveryId: string
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests/${deliveryId}/qr`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const data =
    await parseResponse<
      Record<string, unknown>
    >(response);

  /*
   * Support the response shapes used during development
   * while keeping one normalized return value for the UI.
   */

  if (
    typeof data.qr_token ===
    "string"
  ) {
    return data.qr_token;
  }

  if (
    typeof data.token ===
    "string"
  ) {
    return data.token;
  }

  if (
    typeof data.qrToken ===
    "string"
  ) {
    return data.qrToken;
  }

  if (
    typeof data.qr ===
    "string"
  ) {
    return data.qr;
  }

  /*
   * Nested:
   *
   * {
   *   qr: {
   *     token: "..."
   *   }
   * }
   */
  if (
    data.qr &&
    typeof data.qr ===
      "object"
  ) {
    const qr =
      data.qr as Record<
        string,
        unknown
      >;

    if (
      typeof qr.token ===
      "string"
    ) {
      return qr.token;
    }

    if (
      typeof qr.qr_token ===
      "string"
    ) {
      return qr.qr_token;
    }

    if (
      typeof qr.value ===
      "string"
    ) {
      return qr.value;
    }
  }

  /*
   * Nested:
   *
   * {
   *   delivery: {
   *     qr_token: "..."
   *   }
   * }
   */
  if (
    data.delivery &&
    typeof data.delivery ===
      "object"
  ) {
    const delivery =
      data.delivery as Record<
        string,
        unknown
      >;

    if (
      typeof delivery.qr_token ===
      "string"
    ) {
      return delivery.qr_token;
    }

    if (
      typeof delivery.qrToken ===
      "string"
    ) {
      return delivery.qrToken;
    }

    if (
      typeof delivery.token ===
      "string"
    ) {
      return delivery.token;
    }
  }

  /*
   * Nested:
   *
   * {
   *   data: {
   *     qr_token: "..."
   *   }
   * }
   */
  if (
    data.data &&
    typeof data.data ===
      "object"
  ) {
    const nested =
      data.data as Record<
        string,
        unknown
      >;

    if (
      typeof nested.qr_token ===
      "string"
    ) {
      return nested.qr_token;
    }

    if (
      typeof nested.token ===
      "string"
    ) {
      return nested.token;
    }
  }

  /*
   * We intentionally do not log the response here.
   *
   * The successful response can contain a sensitive
   * delivery QR credential.
   */
  throw new Error(
    "QR token was not returned by the server"
  );
}

/*
 * ==========================================================
 * RIDER DELIVERIES
 * ==========================================================
 */

export async function getMyDeliveries(
  token: string
) {
  const response =
    await fetch(
      `${API_URL}/riders/me/deliveries`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return parseResponse<{
    success: boolean;
    count?: number;
    deliveries: Delivery[];
  }>(response);
}

/*
 * ==========================================================
 * RIDER STATUS TRANSITIONS
 * ==========================================================
 */

export async function updateRiderStatus(
  token: string,
  deliveryId: string,
  payload: {
    to_status:
      | "picked_up"
      | "in_transit";

    version: number;

    client_event_id: string;

    note?: string;

    lat?: number;
    lng?: number;
  }
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests/${deliveryId}/status`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return parseResponse<{
    success: boolean;

    idempotent?: boolean;

    delivery?: Delivery;

    status?: string;

    version?: number;
  }>(response);
}

/*
 * ==========================================================
 * OFFLINE SYNCHRONIZATION
 * ==========================================================
 */

export type OfflineSyncEvent = {
  client_event_id: string;

  delivery_request_id: string;

  to_status:
    | "picked_up"
    | "in_transit";

  version: number;

  note?: string;

  lat?: number;
  lng?: number;

  occurred_at: string;
};

export type SyncResult = {
  client_event_id: string;

  delivery_request_id: string;

  result:
    | "applied"
    | "duplicate"
    | "conflict"
    | "rejected";

  status?: string;

  version?: number;

  error?: {
    code?: string;

    message?: string;

    current_status?: string;

    current_version?: number;
  };
};

export async function syncOfflineEvents(
  token: string,
  events: OfflineSyncEvent[]
) {
  const response =
    await fetch(
      `${API_URL}/sync`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            events,
          }),
      }
    );

  return parseResponse<{
    success: boolean;

    summary: {
      received: number;

      applied: number;

      duplicates: number;

      conflicts: number;

      rejected: number;
    };

    results: SyncResult[];

    server_time: string;
  }>(response);
}

/*
 * ==========================================================
 * PROOF OF DELIVERY
 * ==========================================================
 */

export async function submitProofOfDelivery(
  token: string,
  deliveryId: string,
  payload: {
    scanned_qr_token: string;

    version: number;

    client_event_id: string;

    recipient_name?: string;

    photo_url?: string;

    signature_url?: string;
  }
) {
  const response =
    await fetch(
      `${API_URL}/delivery-requests/${deliveryId}/pod`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return parseResponse<{
    success: boolean;

    idempotent?: boolean;

    delivery?: Delivery;

    proof_of_delivery?: unknown;

    status?: string;

    version?: number;
  }>(response);
}