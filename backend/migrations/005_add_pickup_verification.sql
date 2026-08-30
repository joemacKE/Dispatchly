-- Up Migration

ALTER TABLE delivery_requests
ADD COLUMN IF NOT EXISTS pickup_qr_token TEXT;

ALTER TABLE delivery_requests
ADD COLUMN IF NOT EXISTS pickup_qr_used_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS
idx_delivery_requests_pickup_qr_token
ON delivery_requests(pickup_qr_token)
WHERE pickup_qr_token IS NOT NULL;