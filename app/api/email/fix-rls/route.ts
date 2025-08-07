import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('=== ATTEMPTING TO FIX RLS POLICIES ===');
    
    // Test current access
    const { data: contactsBefore, error: contactsBeforeError } = await supabase
      .from('email_contacts')
      .select('*');
      
    const { data: schedulesBefore, error: schedulesBeforeError } = await supabase
      .from('email_schedules')
      .select('*');
    
    console.log('Before fix - Contacts:', contactsBefore?.length || 0);
    console.log('Before fix - Schedules:', schedulesBefore?.length || 0);
    console.log('Contacts error:', contactsBeforeError);
    console.log('Schedules error:', schedulesBeforeError);
    
    return NextResponse.json({
      success: false,
      message: 'RLS policies need to be fixed manually in Supabase dashboard',
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Run the fix-email-rls-anon.sql script',
        '4. Or manually disable RLS for email tables'
      ],
      currentState: {
        contacts: contactsBefore?.length || 0,
        schedules: schedulesBefore?.length || 0,
        contactsError: contactsBeforeError,
        schedulesError: schedulesBeforeError
      },
      sqlToRun: `
-- Run this in Supabase SQL Editor:
ALTER TABLE email_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
      `
    });
  } catch (error: any) {
    console.error('Fix RLS Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}