import { NextRequest, NextResponse } from 'next/server';
import { EmailSenderService } from '@/services/email-sender.service';
import { EmailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMAIL SEND TEST API CALLED ===');
    const { scheduleId } = await request.json();
    console.log('Schedule ID received:', scheduleId);

    if (!scheduleId) {
      console.log('ERROR: No schedule ID provided');
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Check if email tables exist first
    try {
      console.log('Checking if email tables exist...');
      const schedules = await EmailService.getAllSchedules();
      console.log('Found schedules:', schedules.length);
    } catch (error: any) {
      console.error('Database error when checking schedules:', error);
      if (error.message?.includes('relation "email_schedules" does not exist') || 
          error.message?.includes('table "email_schedules" does not exist')) {
        return NextResponse.json(
          { error: 'Email tables not found. Please run the database migration script first.' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check contacts
    try {
      console.log('Checking contacts...');
      const contacts = await EmailService.getAllContacts();
      console.log('Found contacts:', contacts.length);
      if (contacts.length === 0) {
        return NextResponse.json(
          { error: 'No contacts found. Please add contacts first.' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      throw error;
    }

    console.log('Attempting to send scheduled emails...');
    const result = await EmailSenderService.sendScheduledEmails(scheduleId);
    console.log('Email sending result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Emails sent successfully',
        results: result.results
      });
    } else {
      console.error('Email sending failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('=== API ERROR ===', error);
    console.error('Error stack:', error.stack);
    
    // Check for specific database errors
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Email database tables not found. Please run the migration script.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all active schedules that are due
    const schedules = await EmailService.getAllSchedules();
    const now = new Date();
    
    const dueSchedules = schedules.filter(schedule => {
      if (!schedule.isActive || !schedule.nextSend) return false;
      
      const nextSend = new Date(schedule.nextSend);
      return nextSend <= now;
    });

    return NextResponse.json({
      success: true,
      dueSchedules: dueSchedules.length,
      schedules: dueSchedules
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Check for specific database errors
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Email database tables not found. Please run the migration script.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}