-- Add password_hash column to profiles table for NextAuth.js
-- This column will store bcrypt hashed passwords

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.password_hash IS 'Bcrypt hashed password for NextAuth.js authentication';