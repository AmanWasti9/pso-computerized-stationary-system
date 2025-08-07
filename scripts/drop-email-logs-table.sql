-- Script to completely remove email_logs table and related components from Supabase

-- Drop all policies related to email_logs
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can update email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can delete email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow all operations on email_logs" ON public.email_logs;

-- Drop indexes related to email_logs
DROP INDEX IF EXISTS idx_email_logs_schedule_id;
DROP INDEX IF EXISTS idx_email_logs_status;

-- Drop the email_logs table completely
DROP TABLE IF EXISTS public.email_logs;

-- Confirmation message
SELECT 'Email logs table and all related components have been successfully removed from the database.' as status;