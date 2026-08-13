-- Migration: 002_add_onboarding_fields_to_users.sql
-- Description: Adds weight, height, body_fat, activity_level, and onboarding_completed fields to the users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS body_fat NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
