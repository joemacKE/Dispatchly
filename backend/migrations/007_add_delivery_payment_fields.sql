ALTER TABLE delivery_requests

ADD COLUMN IF NOT EXISTS delivery_qr_token TEXT,

ADD COLUMN IF NOT EXISTS delivery_qr_used_at TIMESTAMP WITH TIME ZONE,

ADD COLUMN IF NOT EXISTS payment_method TEXT
DEFAULT 'prepaid',

ADD COLUMN IF NOT EXISTS payment_status TEXT
DEFAULT 'pending',

ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2),

ADD COLUMN IF NOT EXISTS payment_reference TEXT;


CREATE UNIQUE INDEX IF NOT EXISTS
idx_delivery_requests_delivery_qr_token
ON delivery_requests(delivery_qr_token)
WHERE delivery_qr_token IS NOT NULL;