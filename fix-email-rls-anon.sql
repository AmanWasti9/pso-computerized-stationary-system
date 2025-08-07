-- Fix for email system: Disable RLS to allow anonymous access
-- This is needed because the app uses Supabase anonymous key

-- Disable Row Level Security for email tables
ALTER TABLE email_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Verify the fix by checking table settings
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('email_contacts', 'email_schedules', 'email_logs');