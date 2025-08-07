import { NextResponse } from 'next/server';
import { EmailSenderService } from '@/services/email-sender.service';
import { EmailService } from '@/services/email.service';

export async function POST() {
  try {
    // Get all active schedules
    const schedules = await EmailService.getAllSchedules();
    const now = new Date();
    
    // Find schedules that are due (or overdue)
    const dueSchedules = schedules.filter(schedule => {
      if (!schedule.isActive || !schedule.nextSend) return false;
      
      const nextSend = new Date(schedule.nextSend);
      return nextSend <= now;
    });

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No schedules are currently due',
        processed: 0
      });
    }

    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process each due schedule
    for (const schedule of dueSchedules) {
      try {
        const result = await EmailSenderService.sendScheduledEmails(schedule.id);
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: result.success,
          sent: result.results?.sent || 0,
          failed: result.results?.failed || 0,
          error: result.error
        });

        if (result.success) {
          totalSent += result.results?.sent || 0;
          totalFailed += result.results?.failed || 0;
        }
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          success: false,
          sent: 0,
          failed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueSchedules.length} due schedule(s)`,
      processed: dueSchedules.length,
      totalSent,
      totalFailed,
      results
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
      schedules: dueSchedules.map(s => ({
        id: s.id,
        name: s.name,
        nextSend: s.nextSend,
        recurrence: s.recurrence
      }))
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