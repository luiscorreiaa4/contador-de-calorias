-- Migration: 001_create_users_table.sql
-- Description: Creates users table for authentication and profile data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    goal VARCHAR(50) NOT NULL DEFAULT 'perder_peso',
    sex VARCHAR(50) NOT NULL DEFAULT 'masculino',
    birth_date DATE NOT NULL DEFAULT '1995-01-01',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast user authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
