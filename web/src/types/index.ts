export type UserRole =
  | "retailer"
  | "dispatcher"
  | "rider";

export type AuthUser = {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  role: UserRole;
};

export type LoginResponse = {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type Delivery = {
  id: string;

  business_id?: string;
  created_by_user_id?: string;

  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;

  status: DeliveryStatus;
  version: number;

  rider_id?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;

  assigned_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
};

export type ApiErrorResponse = {
  success?: boolean;

  error?: {
    code?: string;
    message?: string;
    current_status?: string;
    current_version?: number;
  };
};

export type RealtimeEvent = {
  type: string;
  business_id?: string;
  data?: Record<string, unknown>;
  occurred_at?: string;
};