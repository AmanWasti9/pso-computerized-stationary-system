-- Create email_contacts table for storing email addresses with locations
CREATE TABLE IF NOT EXISTS public.email_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_schedules table for storing email scheduling information
CREATE TABLE IF NOT EXISTS public.email_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_name TEXT NOT NULL,
  send_date DATE NOT NULL,
  send_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  next_send TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES public.email_schedules(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_location TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email_contacts
CREATE POLICY "Authenticated users can view email contacts" ON public.email_contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert email contacts" ON public.email_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update email contacts" ON public.email_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete email contacts" ON public.email_contacts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for email_schedules
CREATE POLICY "Authenticated users can view email schedules" ON public.email_schedules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert email schedules" ON public.email_schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update email schedules" ON public.email_schedules
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete email schedules" ON public.email_schedules
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for email_logs
CREATE POLICY "Authenticated users can view email logs" ON public.email_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');