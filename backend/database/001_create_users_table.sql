-- Migration: 001_create_users_table.sql
-- Description: Creates users table for authentication and profile data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    goal VARCHAR(50) NOT NULL DEFAULT 'perder_peso',
    sex VARCHAR(50),
    birth_date DATE,
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    body_fat NUMERIC(5,2),
    activity_level VARCHAR(50),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast user authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
