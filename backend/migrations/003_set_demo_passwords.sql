-- Development accounts only.
-- Demo password: Demo123!

UPDATE users
SET password_hash = crypt(
    'Demo123!',
    gen_salt('bf', 12)
)
WHERE phone IN (
    '+254700000002',
    '+254700000003',
    '+254700000004'
);