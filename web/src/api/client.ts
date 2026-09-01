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
  import.meta.env.VITE_API_URL?.trim();


if (
  import.meta.env.PROD &&
  !configuredApiUrl
) {
  throw new Error(
    "VITE_API_URL is required for production builds"
  );
}


if (
  import.meta.env.PROD &&
  configuredApiUrl &&
  !configuredApiUrl.startsWith("https://")
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
 * RESPONSE HANDLER
 * ==========================================================
 */

async function parseResponse<T>(
  response: Response
): Promise<T> {

  let data: unknown;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      response.ok
        ? "Server returned invalid response"
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
 * AUTH
 * ==========================================================
 */

export async function login(
  phone:string,
  password:string
){

  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method:"POST",

        headers:{
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
 * DELIVERY REQUESTS
 * ==========================================================
 */

export async function getDeliveries(
  token:string
){

  const response =
    await fetch(
      `${API_URL}/delivery-requests`,
      {
        headers:{
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return parseResponse<{
    success:boolean;
    count:number;
    deliveries:Delivery[];
  }>(response);
}



export async function createDelivery(
  token:string,
  payload:{
    customer_name:string;
    customer_phone:string;
    customer_address:string;
    item_description:string;
    payment_method:
      | "prepaid"
      | "cash_on_delivery";
    payment_amount?:number;
  }
){

  const response =
    await fetch(
      `${API_URL}/delivery-requests`,
      {
        method:"POST",

        headers:{
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(payload),
      }
    );


  return parseResponse<{
    success:boolean;
    delivery:Delivery;
  }>(response);

}



export async function getRiders(
  token:string
){

  const response =
    await fetch(
      `${API_URL}/riders`,
      {
        headers:{
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return parseResponse<{
    success:boolean;
    count:number;
    riders:Rider[];
  }>(response);

}



export async function assignDelivery(
  token:string,
  deliveryId:string,
  riderId:string,
  version:number
){

  const response =
    await fetch(
      `${API_URL}/delivery-requests/${deliveryId}/assign`,
      {
        method:"POST",

        headers:{
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            rider_id:riderId,
            version,
          }),
      }
    );


  return parseResponse<{
    success:boolean;
    delivery?:Delivery;
  }>(response);

}



/*
 * ==========================================================
 * RIDER DELIVERY LIST
 * ==========================================================
 */

export async function getMyDeliveries(
  token:string
){

 const response =
   await fetch(
     `${API_URL}/riders/me/deliveries`,
     {
       headers:{
         Authorization:
           `Bearer ${token}`,
       },
     }
   );


 return parseResponse<{
   success:boolean;
   deliveries:Delivery[];
 }>(response);

}



/*
 * ==========================================================
 * PICKUP QR
 * ==========================================================
 */


export async function getPickupQr(
 token:string,
 deliveryId:string
){

 const response =
   await fetch(
     `${API_URL}/delivery-requests/${deliveryId}/pickup-qr`,
     {
       headers:{
         Authorization:
           `Bearer ${token}`,
       },
     }
   );


 const data =
   await parseResponse<{
     pickup_qr_token:string;
   }>(response);


 return data.pickup_qr_token;

}




export async function verifyPickup(
 token:string,
 deliveryId:string,
 payload:{
   scanned_pickup_qr_token:string;
   version:number;
   client_event_id:string;
   lat?:number;
   lng?:number;
 }
){

 const response =
   await fetch(
     `${API_URL}/delivery-requests/${deliveryId}/pickup`,
     {
       method:"POST",

       headers:{
         Authorization:
           `Bearer ${token}`,

         "Content-Type":
           "application/json",
       },

       body:
         JSON.stringify(payload),
     }
   );


 return parseResponse<{
   success:boolean;
   pickup_verified?:boolean;
   delivery?:Delivery;
 }>(response);

}



/*
 * ==========================================================
 * DELIVERY QR
 * ==========================================================
 */


export async function getDeliveryQr(
 token:string,
 deliveryId:string
){

 const response =
   await fetch(
     `${API_URL}/delivery-requests/${deliveryId}/delivery-qr`,
     {
       headers:{
         Authorization:
           `Bearer ${token}`,
       },
     }
   );


 const data =
   await parseResponse<{
     success:boolean;
     delivery_qr_token:string;
     payment_method:string;
     payment_status:string;
     payment_amount:string;
   }>(response);



 if(!data.delivery_qr_token){

   throw new Error(
     "Delivery QR token missing"
   );

 }


 return data.delivery_qr_token;

}





export async function verifyDelivery(
  token:string,
  deliveryId:string,
  payload:{
    scanned_delivery_qr_token:string;
    version:number;
  }
){

 const response =
   await fetch(
     `${API_URL}/delivery-requests/${deliveryId}/delivery`,
     {
       method:"POST",

       headers:{
         Authorization:
           `Bearer ${token}`,

         "Content-Type":
           "application/json",
       },

       body:
         JSON.stringify(payload),
     }
   );


 return parseResponse<{
   success:boolean;
   delivered?:boolean;
   delivery?:Delivery;
 }>(response);

}



/*
 * ==========================================================
 * OFFLINE SYNC
 * ==========================================================
 */


export type OfflineSyncEvent = {

 client_event_id:string;

 delivery_request_id:string;

 to_status:
   | "picked_up"
   | "in_transit";

 version:number;

 note?:string;

 lat?:number;

 lng?:number;

 occurred_at:string;

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
 token:string,
 deliveryId:string,
 payload:any
){

 const response =
   await fetch(
     `${API_URL}/delivery-requests/${deliveryId}/pod`,
     {
       method:"POST",

       headers:{
         Authorization:
           `Bearer ${token}`,

         "Content-Type":
           "application/json",
       },

       body:
         JSON.stringify(payload),
     }
   );


 return parseResponse(response);

}