# Email System RLS Fix Guide

## Problem
Your email system is not sending emails because it cannot fetch schedules and contacts from the database. The logs show:
- "Found schedules: 0"
- "Found contacts: 0"

## Root Cause
The Supabase client is using an **anonymous key**, but your email tables (`email_contacts`, `email_schedules`, `email_logs`) have **Row Level Security (RLS)** enabled, which blocks anonymous access.

## Solution
You need to disable RLS for the email tables to allow anonymous access.

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**

### Step 2: Run the Fix
Copy and paste this SQL command in the SQL Editor:

```sql
-- Disable Row Level Security for email tables
ALTER TABLE email_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('email_contacts', 'email_schedules', 'email_logs');
```

### Step 3: Verify the Fix
After running the SQL:
1. The query should show `rowsecurity = false` for all three tables
2. Test the email system by visiting: `http://localhost:3000/api/email/debug-db`
3. You should now see your contacts and schedules in the response

### Alternative: Use the SQL File
You can also run the `fix-email-rls-anon.sql` file that's been created in your project root.

## Expected Results
After applying the fix:
- ✅ `GET /api/email/debug-db` should show your contacts and schedules
- ✅ Email sending should work properly
- ✅ Logs should show "Found schedules: X" and "Found contacts: Y" with actual numbers

## Security Note
Disabling RLS means anyone with your anonymous Supabase key can access these email tables. If this is a concern, you can implement application-level security or use authenticated Supabase clients instead.