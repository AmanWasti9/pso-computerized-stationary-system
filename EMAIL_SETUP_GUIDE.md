# Email Setup Guide

## Current Issue
Your email system is showing 500 errors because the email configuration in `.env.local` contains placeholder values instead of real credentials.

## Quick Fix Steps

### Option 1: Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to [App Passwords](https://support.google.com/accounts/answer/185833)
   - Select "Mail" and your device
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update `.env.local`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   EMAIL_FROM="PSO Inventory System" <youremail@gmail.com>
   ```

### Option 2: Outlook/Hotmail Setup

1. **Update `.env.local`**:
   ```env
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_USER=youremail@outlook.com
   EMAIL_PASS=your-password
   EMAIL_FROM="PSO Inventory System" <youremail@outlook.com>
   ```

### Option 3: Other Email Providers

- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Contact your email provider for SMTP settings

## Testing Your Setup

1. **Restart your development server** after updating `.env.local`
2. **Go to Email Management page**
3. **Add a test contact** with your email
4. **Create a test schedule**
5. **Click "Send Reminder Now"**

## Troubleshooting

- **"Missing credentials"**: Update `.env.local` with real values
- **"Authentication failed"**: Check username/password
- **"Connection refused"**: Check host/port settings
- **Gmail "Less secure apps"**: Use App Password instead

## Security Notes

- Never commit `.env.local` to version control
- Use App Passwords for Gmail (more secure)
- Keep your email credentials private