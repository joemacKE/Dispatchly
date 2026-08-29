-- Up Migration

ALTER TABLE status_events
ADD COLUMN IF NOT EXISTS client_occurred_at TIMESTAMPTZ;


-- Down Migration

ALTER TABLE status_events
DROP COLUMN IF EXISTS client_occurred_at;