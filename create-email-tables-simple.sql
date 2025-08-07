-- Create email_contacts table
CREATE TABLE IF NOT EXISTS email_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_schedules table
CREATE TABLE IF NOT EXISTS email_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  send_day INTEGER NOT NULL CHECK (send_day >= 1 AND send_day <= 31),
  send_time TIME NOT NULL,
  recurrence VARCHAR(50) DEFAULT 'monthly' CHECK (recurrence IN ('monthly', 'weekly', 'daily')),
  is_active BOOLEAN DEFAULT true,
  next_send TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES email_schedules(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_contacts
CREATE POLICY "Users can view email_contacts" ON email_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_contacts" ON email_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_contacts" ON email_contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_contacts" ON email_contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for email_schedules
CREATE POLICY "Users can view email_schedules" ON email_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_schedules" ON email_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_schedules" ON email_schedules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_schedules" ON email_schedules FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for email_logs
CREATE POLICY "Users can view email_logs" ON email_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_logs" ON email_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_logs" ON email_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_logs" ON email_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_contacts_location ON email_contacts(location);
CREATE INDEX IF NOT EXISTS idx_email_contacts_active ON email_contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_schedules_location ON email_schedules(location);
CREATE INDEX IF NOT EXISTS idx_email_schedules_active ON email_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_email_schedules_next_send ON email_schedules(next_send);
CREATE INDEX IF NOT EXISTS idx_email_logs_schedule_id ON email_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);