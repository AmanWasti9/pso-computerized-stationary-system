import nodemailer from 'nodemailer';
import { EmailService, type EmailContact, type EmailSchedule } from './email.service';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export class EmailSenderService {
  private static config: EmailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'amanwasti5@gmail.com',
    pass: 'agtn goqi zydy cuyh'
  };

  private static createTransporter() {
    // Validate configuration
    if (!this.config.user || this.config.user.includes('your-')) {
      throw new Error('EMAIL_USER not configured. Please update your .env.local file with a real email address.');
    }
    
    if (!this.config.pass || this.config.pass.includes('your-') || this.config.pass.includes('password')) {
      throw new Error('EMAIL_PASS not configured. Please update your .env.local file with a real password/app-password.');
    }

    if (!this.config.host || this.config.host.includes('your-')) {
      throw new Error('EMAIL_HOST not configured. Please update your .env.local file.');
    }

    return nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`=== SENDING EMAIL ===`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: "PSO Inventory System" <${this.config.user}>`);
      
      const transporter = this.createTransporter();
      console.log('Transporter created successfully');

      const mailOptions = {
        from: `"PSO Inventory System" <${this.config.user}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('=== EMAIL SENDING FAILED ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error code:', (error as any)?.code);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async sendBulkEmails(
    contacts: EmailContact[],
    subject: string,
    htmlTemplate: string,
    scheduleId?: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    console.log('=== SENDING BULK EMAILS ===');
    console.log('Contacts to send to:', contacts.length);
    console.log('Subject:', subject);
    console.log('Schedule ID:', scheduleId);
    
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contact of contacts) {
      if (!contact.isActive) {
        continue;
      }

      try {
        console.log(`Sending email to: ${contact.email} (${contact.name})`);
        
        // Personalize the email content
        const personalizedHtml = htmlTemplate
          .replace(/{{name}}/g, contact.name || contact.email)
          .replace(/{{location}}/g, contact.location)
          .replace(/{{email}}/g, contact.email);

        const result = await this.sendEmail(
          contact.email,
          subject,
          personalizedHtml
        );

        if (result.success) {
          console.log(`Email sent successfully to ${contact.email}`);
          results.sent++;
        } else {
          console.error(`Failed to send email to ${contact.email}:`, result.error);
          results.failed++;
          results.errors.push(`${contact.email}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error);
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${contact.email}: ${errorMessage}`);
      }

      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Bulk email sending completed. Results:', results);
    return results;
  }

  static generateInventoryReminderHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>PSO Inventory Reminder</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            background: #fef2f2;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #fecaca;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .location-badge {
            background: #dc2626;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .reminder-section {
            margin: 25px 0;
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
          }
          .reminder-section h3 {
            color: #dc2626;
            margin-top: 0;
          }
          .action-items {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .action-items h4 {
            color: #ea580c;
            margin-top: 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .footer strong {
            color: #dc2626;
          }
          .urgent {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .urgent h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 PSO Inventory Reminder</h1>
          <p>Pakistan State Oil - Inventory Update Required</p>
        </div>

        <div class="content">
          <div class="greeting">
            Hello <strong>{{name}}</strong>,
          </div>
          
          <div class="urgent">
            <h3>⚠️ Action Required</h3>
            <p>This is a reminder to update your inventory information in the PSO Inventory Management System.</p>
          </div>
          
          <p>We hope this email finds you well. This is an automated reminder for:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="location-badge">{{location}}</span>
          </div>

          <div class="reminder-section">
            <h3>📋 Reminder: ${data?.scheduleName || 'Inventory Update'}</h3>
            <p>Please take a moment to review and update your current inventory levels in the system. Accurate inventory data is crucial for:</p>
            <ul>
              <li>Efficient supply chain management</li>
              <li>Preventing stockouts and overstock situations</li>
              <li>Accurate reporting and forecasting</li>
              <li>Optimal resource allocation</li>
            </ul>
          </div>

          <div class="action-items">
            <h4>🎯 Required Actions:</h4>
            <ol>
              <li><strong>Log into the PSO Inventory Management System</strong></li>
              <li><strong>Review current stock levels</strong> for all items at your location</li>
              <li><strong>Update quantities</strong> to reflect actual inventory counts</li>
              <li><strong>Report any discrepancies</strong> or issues immediately</li>
              <li><strong>Submit your updated inventory</strong> before the deadline</li>
            </ol>
          </div>

          <div class="reminder-section">
            <h3>📊 Current System Status</h3>
            <p><strong>System Status:</strong> ${data?.systemStatus || 'All systems operational'}</p>
            <p><strong>Last Update:</strong> Please check your last update timestamp in the system</p>
            <p><strong>Priority Items:</strong> Pay special attention to fast-moving and critical items</p>
          </div>

          <p style="margin-top: 30px; font-weight: bold; color: #dc2626;">
            ⏰ Please complete your inventory update as soon as possible to ensure accurate system data.
          </p>

          <p>
            If you have any questions, need assistance, or encounter technical issues, please don't hesitate to contact our support team immediately.
          </p>

          <p>
            Thank you for your prompt attention to this matter.<br>
            <strong>PSO Inventory Management Team</strong>
          </p>
        </div>

        <div class="footer">
          <p>
            <strong>PSO Inventory Management System</strong><br>
            This is an automated reminder email. Please do not reply to this message.<br>
            Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  static generateInventoryReportHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>PSO Inventory Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #059669, #0d9488);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .location-badge {
            background: #10b981;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .report-section {
            margin: 25px 0;
          }
          .report-section h3 {
            color: #059669;
            border-bottom: 2px solid #10b981;
            padding-bottom: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
          }
          .stat-label {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .footer strong {
            color: #059669;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PSO Inventory Report</h1>
          <p>Pakistan State Oil - Monthly Inventory Summary</p>
        </div>

        <div class="content">
          <div class="greeting">
            Hello <strong>{{name}}</strong>,
          </div>
          
          <p>We hope this email finds you well. Please find below the monthly inventory report for your location:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="location-badge">{{location}}</span>
          </div>

          <div class="report-section">
            <h3>📊 Inventory Summary</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${data?.totalItems || 0}</div>
                <div class="stat-label">Total Items</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data?.totalStock || 0}</div>
                <div class="stat-label">Total Stock</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data?.lowStockItems || 0}</div>
                <div class="stat-label">Low Stock Items</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data?.recentDispatches || 0}</div>
                <div class="stat-label">Recent Dispatches</div>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h3>📈 Key Highlights</h3>
            <ul>
              <li>Inventory levels are ${data?.inventoryStatus || 'stable'}</li>
              <li>Recent stock movements: ${data?.stockMovements || 'Normal activity'}</li>
              <li>Upcoming deliveries: ${data?.upcomingDeliveries || 'None scheduled'}</li>
              <li>System status: ${data?.systemStatus || 'All systems operational'}</li>
            </ul>
          </div>

          <div class="report-section">
            <h3>🔔 Action Items</h3>
            <p>
              ${data?.actionItems || 'No immediate action required. Continue monitoring inventory levels and ensure timely restocking of low-stock items.'}
            </p>
          </div>

          <p style="margin-top: 30px;">
            For detailed reports and real-time inventory management, please log in to the PSO Inventory Management System.
          </p>

          <p>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>

          <p>
            Best regards,<br>
            <strong>PSO Inventory Management Team</strong>
          </p>
        </div>

        <div class="footer">
          <p>
            <strong>PSO Inventory Management System</strong><br>
            This is an automated email. Please do not reply to this message.<br>
            Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      </body>
      </html>
    `;
  }

  static async sendScheduledEmails(scheduleId: string): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      console.log('=== SENDING SCHEDULED EMAILS ===');
      console.log('Schedule ID:', scheduleId);
      
      // Get schedule details
      console.log('Fetching schedules...');
      const schedules = await EmailService.getAllSchedules();
      console.log('Total schedules found:', schedules.length);
      
      const schedule = schedules.find(s => s.id === scheduleId);
      console.log('Target schedule found:', !!schedule);
      
      if (!schedule || !schedule.isActive) {
        console.log('Schedule not found or inactive');
        return { success: false, error: 'Schedule not found or inactive' };
      }

      // Get all active contacts - for reminder emails, send to ALL locations
      console.log('Fetching contacts...');
      const contacts = await EmailService.getAllContacts();
      console.log('Total contacts found:', contacts.length);
      
      const activeContacts = contacts.filter(c => c.isActive);
      console.log('Active contacts found:', activeContacts.length);

      if (activeContacts.length === 0) {
        console.log('No active contacts found');
        return { success: false, error: 'No active contacts found' };
      }

      // Generate email content - this is a reminder email for all locations
      console.log('Generating email content...');
      const subject = `PSO Inventory Reminder - ${schedule.name}`;
      console.log('Subject:', subject);
      const htmlTemplate = this.generateInventoryReminderHtml({
        scheduleName: schedule.name,
        totalItems: 150,
        totalStock: 2500,
        lowStockItems: 5,
        recentDispatches: 25,
        inventoryStatus: 'stable',
        stockMovements: 'Normal activity',
        upcomingDeliveries: 'Next delivery scheduled for next week',
        systemStatus: 'All systems operational',
        actionItems: 'Please review your inventory levels and update the system with current stock counts.'
      });

      // Send bulk emails to ALL active contacts (all locations)
      console.log('Sending bulk emails to', activeContacts.length, 'contacts...');
      const results = await this.sendBulkEmails(
        activeContacts,
        subject,
        htmlTemplate,
        scheduleId
      );
      console.log('Bulk email results:', results);

      // Update next send date based on recurrence
      if (schedule.recurrence !== 'none') {
        const nextSend = new Date(schedule.nextSend || new Date());
        
        switch (schedule.recurrence) {
          case 'daily':
            nextSend.setDate(nextSend.getDate() + 1);
            break;
          case 'weekly':
            nextSend.setDate(nextSend.getDate() + 7);
            break;
          case 'monthly':
          default:
            nextSend.setMonth(nextSend.getMonth() + 1);
            break;
        }
        
        await EmailService.updateSchedule(scheduleId, {
          nextSend: nextSend.toISOString()
        });
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error sending scheduled emails:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}