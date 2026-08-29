-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE business_type AS ENUM (
    'electronics',
    'pharmacy',
    'hardware',
    'other'
);


CREATE TYPE user_role AS ENUM (
    'retailer',
    'dispatcher',
    'rider',
    'admin'
);


CREATE TYPE delivery_status AS ENUM (
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled'
);


CREATE TYPE device_platform AS ENUM (
    'android',
    'ios',
    'web'
);


-- ============================================================
-- REMOVE TEMPORARY TABLES
-- ============================================================

DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ============================================================
-- BUSINESSES
-- ============================================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    type business_type NOT NULL,

    address TEXT NOT NULL,

    phone TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL,

    name TEXT NOT NULL,

    phone TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_business_fk
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT
);


CREATE INDEX idx_users_business_id
    ON users(business_id);


CREATE INDEX idx_users_business_role
    ON users(business_id, role);


-- ============================================================
-- DELIVERY REQUESTS
-- ============================================================

CREATE TABLE delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL,

    created_by_user_id UUID NOT NULL,

    customer_name TEXT NOT NULL,

    customer_phone TEXT NOT NULL,

    customer_address TEXT NOT NULL,

    item_description TEXT NOT NULL,

    status delivery_status NOT NULL DEFAULT 'pending',

    qr_token TEXT NOT NULL UNIQUE,

    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT delivery_requests_business_fk
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT,

    CONSTRAINT delivery_requests_created_by_fk
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


CREATE INDEX idx_delivery_requests_business_status
    ON delivery_requests(business_id, status);


CREATE INDEX idx_delivery_requests_qr_token
    ON delivery_requests(qr_token);


CREATE INDEX idx_delivery_requests_created_by
    ON delivery_requests(created_by_user_id);


-- ============================================================
-- ASSIGNMENTS
-- ============================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_request_id UUID NOT NULL,

    rider_id UUID NOT NULL,

    assigned_by_user_id UUID NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    unassigned_at TIMESTAMPTZ,

    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT assignments_delivery_request_fk
        FOREIGN KEY (delivery_request_id)
        REFERENCES delivery_requests(id)
        ON DELETE RESTRICT,

    CONSTRAINT assignments_rider_fk
        FOREIGN KEY (rider_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT assignments_assigned_by_fk
        FOREIGN KEY (assigned_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


CREATE UNIQUE INDEX idx_assignments_one_current
    ON assignments(delivery_request_id)
    WHERE is_current = TRUE;


CREATE INDEX idx_assignments_rider
    ON assignments(rider_id);


CREATE INDEX idx_assignments_delivery_request
    ON assignments(delivery_request_id);


-- ============================================================
-- STATUS EVENTS
-- ============================================================

CREATE TABLE status_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_request_id UUID NOT NULL,

    actor_user_id UUID NOT NULL,

    from_status delivery_status,

    to_status delivery_status NOT NULL,

    note TEXT,

    lat NUMERIC,

    lng NUMERIC,

    client_event_id UUID NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT status_events_delivery_request_fk
        FOREIGN KEY (delivery_request_id)
        REFERENCES delivery_requests(id)
        ON DELETE RESTRICT,

    CONSTRAINT status_events_actor_fk
        FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


CREATE INDEX idx_status_events_delivery_request
    ON status_events(delivery_request_id);


CREATE INDEX idx_status_events_actor
    ON status_events(actor_user_id);


CREATE INDEX idx_status_events_created_at
    ON status_events(created_at);


-- ============================================================
-- PROOF OF DELIVERY
-- ============================================================

CREATE TABLE proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_request_id UUID NOT NULL UNIQUE,

    scanned_qr_token TEXT NOT NULL,

    photo_url TEXT,

    recipient_name TEXT,

    signature_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pod_delivery_request_fk
        FOREIGN KEY (delivery_request_id)
        REFERENCES delivery_requests(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- DEVICES
-- ============================================================

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    push_token TEXT NOT NULL,

    platform device_platform NOT NULL,

    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT devices_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


CREATE UNIQUE INDEX idx_devices_push_token
    ON devices(push_token);


CREATE INDEX idx_devices_user
    ON devices(user_id);


-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type TEXT NOT NULL,

    entity_id UUID NOT NULL,

    actor_user_id UUID,

    action TEXT NOT NULL,

    diff JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_log_actor_fk
        FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE INDEX idx_audit_log_entity
    ON audit_log(entity_type, entity_id);


CREATE INDEX idx_audit_log_actor
    ON audit_log(actor_user_id);


CREATE INDEX idx_audit_log_created_at
    ON audit_log(created_at);


-- Down Migration

