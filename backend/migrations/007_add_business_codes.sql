-- Up Migration


ALTER TABLE businesses
ADD COLUMN business_code TEXT;


CREATE UNIQUE INDEX idx_businesses_business_code
ON businesses(business_code);



-- Generate codes for existing businesses
UPDATE businesses
SET business_code =
    UPPER(
        LEFT(
            REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'),
            4
        )
    )
    ||
    '-'
    ||
    FLOOR(
        RANDOM() * 90000 + 10000
    )::TEXT
WHERE business_code IS NULL;



ALTER TABLE businesses
ALTER COLUMN business_code SET NOT NULL;



-- Down Migration


DROP INDEX IF EXISTS idx_businesses_business_code;


ALTER TABLE businesses
DROP COLUMN IF EXISTS business_code
