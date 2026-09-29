-- Migration: Add 'god' role to user_role enum
-- Created: 2026-01-13
-- Purpose: Enable God-level administrative access

-- Add 'god' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'god';

-- Create index for role-based queries (especially for god/admin lookups)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment
COMMENT ON COLUMN users.role IS 'User role: user, moderator, admin, system, or god (God-level access)';
