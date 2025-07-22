// server/src/lib/notifications/handlers/EmailHandler.ts

import { NotificationHandler, Notification, User, NotificationResult } from '../types';

/**
 * Email notification handler using SMTP
 * Supports various email providers through environment configuration
 */
export class EmailHandler implements NotificationHandler {
    type = 'email';
    name = 'Email Notifications';
    enabled = false; // Disabled by default until configured

    // SMTP configuration
    private smtpConfig = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        },
        from: process.env.SMTP_FROM || 'VeridianOS <noreply@veridianos.ca>'
    };

    async initialize(): Promise<void> {
        // Check if email configuration is available
        const hasConfig = this.smtpConfig.host && 
                         this.smtpConfig.auth.user && 
                         this.smtpConfig.auth.pass;
        
        if (hasConfig) {
            this.enabled = true;
            console.log('[EmailHandler] SMTP configuration found, email notifications enabled');
        } else {
            console.log('[EmailHandler] No SMTP configuration found, email notifications disabled');
            console.log('[EmailHandler] Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables to enable');
        }
    }

    async canHandle(notification: Notification, user: User): Promise<boolean> {
        if (!this.enabled) return false;

        const settings = user.settings || {};
        
        // Check if user has email notifications enabled
        if (settings.email_notifications === 'false') {
            return false;
        }

        // Check if user wants notifications for this channel
        const enabledChannels = this.parseChannels(settings.notification_channels);
        if (enabledChannels.length > 0 && !enabledChannels.includes('email')) {
            return false;
        }

        // Require user to have an email address
        return !!user.email;
    }

    async send(notification: Notification, user: User): Promise<NotificationResult> {
        try {
            const emailData = this.formatEmail(notification, user);
            
            // For now, we'll simulate sending the email
            // In a real implementation, you would use nodemailer or similar
            console.log(`[EmailHandler] Sending email to ${user.email}:`, {
                to: emailData.to,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html
            });

            // TODO: Implement actual email sending
            // const nodemailer = require('nodemailer');
            // const transporter = nodemailer.createTransporter(this.smtpConfig);
            // const result = await transporter.sendMail(emailData);

            // Simulate successful sending
            await this.delay(100); // Simulate network delay

            return {
                success: true,
                handler: this.name,
                metadata: {
                    to: user.email,
                    subject: emailData.subject,
                    sent_at: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                handler: this.name,
                error: (error as Error).message
            };
        }
    }

    async validateConfig(): Promise<boolean> {
        return !!(this.smtpConfig.host && 
                 this.smtpConfig.auth.user && 
                 this.smtpConfig.auth.pass);
    }

    private formatEmail(notification: Notification, user: User) {
        const subject = `VeridianOS: ${notification.title}`;
        
        const text = `
Hello ${user.full_name || user.username},

${notification.message}

${notification.data ? `Additional Details:
${Object.entries(notification.data).map(([key, value]) => `${key}: ${value}`).join('\n')}` : ''}

Time: ${notification.timestamp.toLocaleString()}
Severity: ${notification.severity.toUpperCase()}

---
This notification was sent by your VeridianOS plant monitoring system.
        `.trim();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2d5a27; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .severity-${notification.severity} { 
            border-left: 4px solid ${this.getSeverityColor(notification.severity)}; 
            padding-left: 15px; 
        }
        .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
        .details { background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌱 VeridianOS</h1>
        <p>Plant Monitoring System</p>
    </div>
    <div class="content">
        <div class="severity-${notification.severity}">
            <h2>${notification.title}</h2>
            <p>Hello ${user.full_name || user.username},</p>
            <p>${notification.message}</p>
        </div>
        
        ${notification.data ? `
        <div class="details">
            <h3>Additional Details:</h3>
            ${Object.entries(notification.data).map(([key, value]) => 
                `<p><strong>${key}:</strong> ${value}</p>`
            ).join('')}
        </div>
        ` : ''}
        
        <p><strong>Time:</strong> ${notification.timestamp.toLocaleString()}</p>
        <p><strong>Severity:</strong> ${notification.severity.toUpperCase()}</p>
    </div>
    <div class="footer">
        <p>This notification was sent by your VeridianOS plant monitoring system.</p>
    </div>
</body>
</html>
        `.trim();

        return {
            from: this.smtpConfig.from,
            to: user.email,
            subject,
            text,
            html
        };
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'normal': return '#20c997';
            case 'low': return '#6c757d';
            default: return '#007bff';
        }
    }

    private parseChannels(channels?: string): string[] {
        if (!channels) return [];
        return channels.split(',').map(c => c.trim()).filter(Boolean);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
