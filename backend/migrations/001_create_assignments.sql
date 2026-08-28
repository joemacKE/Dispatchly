CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,

    request_id INTEGER NOT NULL,

    dispatcher_id INTEGER NOT NULL,

    rider_id INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'assigned',

    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

    picked_up_at TIMESTAMP NULL,

    delivered_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT assignments_status_check
        CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered'))
);
