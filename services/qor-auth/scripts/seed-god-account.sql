-- Seed script to create God-level account
-- Usage: psql -U qor_auth -d qor_auth -f scripts/seed-god-account.sql
-- Or: Update the email/password and run manually

-- Create God account (update email and password hash as needed)
-- Password: Use Argon2 hash from AuthService::hash_password()
-- For testing: You can use a temporary password and change it via admin portal

INSERT INTO users (
    email,
    username,
    discriminator,
    password_hash,
    email_verified,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    'admin@demiurge.cloud',  -- UPDATE THIS EMAIL
    'god',
    1,
    '$argon2id$v=19$m=65536,t=3,p=4$CHANGE_ME_HASH',  -- UPDATE THIS WITH REAL HASH
    true,
    'god',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'god',
    status = 'active',
    updated_at = NOW();

-- Verify the account was created
SELECT 
    id,
    email,
    qor_id,
    role,
    status
FROM users
WHERE role = 'god';
