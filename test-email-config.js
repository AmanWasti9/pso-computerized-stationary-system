// Simple test to verify email configuration
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load .env.local file manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('✓ Loaded .env.local file');
} else {
  console.log('⚠ No .env.local file found');
}

console.log('=== EMAIL CONFIGURATION TEST ===');

// Check environment variables
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***HIDDEN***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Test transporter creation
try {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('Transporter created successfully');
  
  // Test connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP connection failed:', error);
    } else {
      console.log('SMTP connection successful');
    }
  });
  
} catch (error) {
  console.error('Failed to create transporter:', error);
}