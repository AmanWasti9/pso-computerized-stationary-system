import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('=== DATABASE DEBUG ===');
    
    // Check current user/session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('User error:', userError);
    
    // Test direct query without RLS
    const { data: contactsRaw, error: contactsError } = await supabase
      .from('email_contacts')
      .select('*');
    
    console.log('Contacts query result:', contactsRaw);
    console.log('Contacts error:', contactsError);
    
    const { data: schedulesRaw, error: schedulesError } = await supabase
      .from('email_schedules')
      .select('*');
    
    console.log('Schedules query result:', schedulesRaw);
    console.log('Schedules error:', schedulesError);
    
    return NextResponse.json({
      user: user,
      userError: userError,
      contacts: {
        data: contactsRaw,
        error: contactsError,
        count: contactsRaw?.length || 0
      },
      schedules: {
        data: schedulesRaw,
        error: schedulesError,
        count: schedulesRaw?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}