import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call the send-all-due endpoint to process scheduled emails
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send-all-due`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Scheduler executed successfully',
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error: any) {
    console.error('Scheduler Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Same as GET for flexibility
  return GET();
}