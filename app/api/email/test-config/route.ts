import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== EMAIL CONFIGURATION CHECK ===');
    
    const config = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM,
    };
    
    console.log('Email configuration:', config);
    
    // Check if all required variables are set and not placeholder values
    const missingVars = [];
    const placeholderVars = [];
    
    if (!process.env.EMAIL_HOST) {
      missingVars.push('EMAIL_HOST');
    } else if (process.env.EMAIL_HOST.includes('your-')) {
      placeholderVars.push('EMAIL_HOST');
    }
    
    if (!process.env.EMAIL_PORT) {
      missingVars.push('EMAIL_PORT');
    }
    
    if (!process.env.EMAIL_USER) {
      missingVars.push('EMAIL_USER');
    } else if (process.env.EMAIL_USER.includes('your-')) {
      placeholderVars.push('EMAIL_USER');
    }
    
    if (!process.env.EMAIL_PASS) {
      missingVars.push('EMAIL_PASS');
    } else if (process.env.EMAIL_PASS.includes('your-') || process.env.EMAIL_PASS.includes('password')) {
      placeholderVars.push('EMAIL_PASS');
    }
    
    if (!process.env.EMAIL_FROM) {
      missingVars.push('EMAIL_FROM');
    } else if (process.env.EMAIL_FROM.includes('your-')) {
      placeholderVars.push('EMAIL_FROM');
    }
    
    if (missingVars.length > 0 || placeholderVars.length > 0) {
      let errorMessage = '';
      if (missingVars.length > 0) {
        errorMessage += `Missing environment variables: ${missingVars.join(', ')}. `;
      }
      if (placeholderVars.length > 0) {
        errorMessage += `Placeholder values detected in: ${placeholderVars.join(', ')}. Please update .env.local with real values.`;
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage.trim(),
        missingVars,
        placeholderVars,
        config: {
          ...config,
          EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'All email environment variables are set',
      config: {
        ...config,
        EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'
      }
    });
    
  } catch (error: any) {
    console.error('Configuration check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}