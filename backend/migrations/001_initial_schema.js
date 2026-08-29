exports.up = (pgm) => {
  // ============================================================
  // ENUM TYPES
  // ============================================================

  pgm.createType("business_type", [
    "electronics",
    "pharmacy",
    "hardware",
    "other",
  ]);

  pgm.createType("user_role", [
    "retailer",
    "dispatcher",
    "rider",
  ]);

  pgm.createType("delivery_status", [
    "pending",
    "assigned",
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
  ]);

  pgm.createType("platform_type", [
    "ios",
    "android",
    "web",
  ]);

  // ============================================================
  // BUSINESSES
  // ============================================================

  pgm.createTable("businesses", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: {
      type: "text",
      notNull: true,
    },

    type: {
      type: "business_type",
      notNull: true,
    },

    address: {
      type: "text",
      notNull: true,
    },

    phone: {
      type: "text",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("businesses", "phone");

  // ============================================================
  // USERS
  // ============================================================

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    business_id: {
      type: "uuid",
      notNull: true,
      references: "businesses(id)",
      onDelete: "RESTRICT",
    },

    name: {
      type: "text",
      notNull: true,
    },

    phone: {
      type: "text",
      notNull: true,
    },

    password_hash: {
      type: "text",
      notNull: true,
    },

    role: {
      type: "user_role",
      notNull: true,
    },

    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("users", ["business_id", "role"]);

  pgm.createIndex("users", "phone", {
    unique: true,
  });

  // ============================================================
  // DELIVERY REQUESTS
  // ============================================================

  pgm.createTable("delivery_requests", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    business_id: {
      type: "uuid",
      notNull: true,
      references: "businesses(id)",
      onDelete: "RESTRICT",
    },

    created_by_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "RESTRICT",
    },

    customer_name: {
      type: "text",
      notNull: true,
    },

    customer_phone: {
      type: "text",
      notNull: true,
    },

    customer_address: {
      type: "text",
      notNull: true,
    },

    item_description: {
      type: "text",
      notNull: true,
    },

    status: {
      type: "delivery_status",
      notNull: true,
      default: "pending",
    },

    qr_token: {
      type: "text",
      notNull: true,
      unique: true,
    },

    version: {
      type: "integer",
      notNull: true,
      default: 1,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // ============================================================
  // DELIVERY REQUEST INDEXES
  // ============================================================

  // Hottest dispatcher query:
  // "Give me this business's open deliveries"
  pgm.createIndex(
    "delivery_requests",
    ["business_id", "status"]
  );

  pgm.createIndex(
    "delivery_requests",
    "qr_token",
    {
      unique: true,
    }
  );

  // ============================================================
  // ASSIGNMENTS
  // ============================================================

  pgm.createTable("assignments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    delivery_request_id: {
      type: "uuid",
      notNull: true,
      references: "delivery_requests(id)",
      onDelete: "RESTRICT",
    },

    rider_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "RESTRICT",
    },

    assigned_by_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "RESTRICT",
    },

    assigned_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },

    unassigned_at: {
      type: "timestamptz",
      default: null,
    },

    is_current: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });

  pgm.createIndex(
    "assignments",
    "delivery_request_id"
  );

  pgm.createIndex(
    "assignments",
    "rider_id"
  );

  // Only ONE current assignment can exist
  // for a delivery request.
  pgm.createIndex(
    "assignments",
    "delivery_request_id",
    {
      unique: true,
      where: "is_current = true",
      name: "assignments_one_current_per_delivery",
    }
  );

  // ============================================================
  // STATUS EVENTS
  // ============================================================

  pgm.createTable("status_events", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    delivery_request_id: {
      type: "uuid",
      notNull: true,
      references: "delivery_requests(id)",
      onDelete: "RESTRICT",
    },

    actor_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "RESTRICT",
    },

    from_status: {
      type: "delivery_status",
      notNull: true,
    },

    to_status: {
      type: "delivery_status",
      notNull: true,
    },

    note: {
      type: "text",
    },

    lat: {
      type: "numeric",
    },

    lng: {
      type: "numeric",
    },

    client_event_id: {
      type: "uuid",
      notNull: true,
      unique: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex(
    "status_events",
    "delivery_request_id"
  );

  pgm.createIndex(
    "status_events",
    "actor_user_id"
  );

  // ============================================================
  // PROOF OF DELIVERY
  // ============================================================

  pgm.createTable("proof_of_delivery", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    delivery_request_id: {
      type: "uuid",
      notNull: true,
      references: "delivery_requests(id)",
      onDelete: "RESTRICT",
    },

    scanned_qr_token: {
      type: "text",
      notNull: true,
    },

    photo_url: {
      type: "text",
    },

    recipient_name: {
      type: "text",
    },

    signature_url: {
      type: "text",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // One POD per delivery
  pgm.createIndex(
    "proof_of_delivery",
    "delivery_request_id",
    {
      unique: true,
    }
  );

  // ============================================================
  // DEVICES
  // ============================================================

  pgm.createTable("devices", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "RESTRICT",
    },

    push_token: {
      type: "text",
      notNull: true,
    },

    platform: {
      type: "platform_type",
      notNull: true,
    },

    last_synced_at: {
      type: "timestamptz",
    },
  });

  pgm.createIndex(
    "devices",
    "user_id"
  );

  pgm.createIndex(
    "devices",
    "push_token",
    {
      unique: true,
    }
  );

  // ============================================================
  // AUDIT LOG
  // ============================================================

  pgm.createTable("audit_log", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    entity_type: {
      type: "text",
      notNull: true,
    },

    entity_id: {
      type: "uuid",
      notNull: true,
    },

    actor_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },

    action: {
      type: "text",
      notNull: true,
    },

    diff: {
      type: "jsonb",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex(
    "audit_log",
    ["entity_type", "entity_id"]
  );

  pgm.createIndex(
    "audit_log",
    "actor_user_id"
  );
};


exports.down = (pgm) => {
  pgm.dropTable("audit_log");
  pgm.dropTable("devices");
  pgm.dropTable("proof_of_delivery");
  pgm.dropTable("status_events");
  pgm.dropTable("assignments");
  pgm.dropTable("delivery_requests");
  pgm.dropTable("users");
  pgm.dropTable("businesses");

  pgm.dropType("platform_type");
  pgm.dropType("delivery_status");
  pgm.dropType("user_role");
  pgm.dropType("business_type");
};
