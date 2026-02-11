-- Migration: Add lce and lcestaff roles to user roles enum
-- Note: ALTER TYPE ... ADD VALUE cannot be executed within a transaction block in some Postgres versions.
-- This migration adds the new roles to the existing ENUM type.

ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'lcestaff';
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'lce';
