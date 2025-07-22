// server/src/lib/notifications/handlers/SMSHandler.ts

import { NotificationHandler, Notification, User, NotificationResult } from '../types';

/**
 * SMS notification handler using Twilio
 * Requires Twilio account and phone number configuration
 */
export class SMSHandler implements NotificationHandler {
    type = 'sms';
    name = 'SMS Notifications';
    enabled = false; // Disabled by default until configured

    // Twilio configuration
    private twilioConfig = {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
    };

    async initialize(): Promise<void> {
        // Check if Twilio configuration is available
        const hasConfig = this.twilioConfig.accountSid && 
                         this.twilioConfig.authToken && 
                         this.twilioConfig.fromNumber;
        
        if (hasConfig) {
            this.enabled = true;
            console.log('[SMSHandler] Twilio configuration found, SMS notifications enabled');
        } else {
            console.log('[SMSHandler] No Twilio configuration found, SMS notifications disabled');
            console.log('[SMSHandler] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER environment variables to enable');
        }
    }

    async canHandle(notification: Notification, user: User): Promise<boolean> {
        if (!this.enabled) return false;

        const settings = user.settings || {};
        
        // Check if user has SMS notifications enabled
        if (settings.sms_notifications === 'false') {
            return false;
        }

        // Check if user wants notifications for this channel
        const enabledChannels = this.parseChannels(settings.notification_channels);
        if (enabledChannels.length > 0 && !enabledChannels.includes('sms')) {
            return false;
        }

        // Require user to have a phone number
        const phoneNumber = settings.phone_number || settings.mobile_number;
        return !!phoneNumber;
    }

    async send(notification: Notification, user: User): Promise<NotificationResult> {
        try {
            const settings = user.settings || {};
            const phoneNumber = settings.phone_number || settings.mobile_number;
            
            if (!phoneNumber) {
                throw new Error('No phone number found for user');
            }

            const message = this.formatSMSMessage(notification, user);
            
            // For now, we'll simulate sending the SMS
            // In a real implementation, you would use the Twilio SDK
            console.log(`[SMSHandler] Sending SMS to ${phoneNumber}:`, {
                to: phoneNumber,
                from: this.twilioConfig.fromNumber,
                message: message
            });

            // TODO: Implement actual SMS sending
            // const twilio = require('twilio');
            // const client = twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);
            // const result = await client.messages.create({
            //     body: message,
            //     from: this.twilioConfig.fromNumber,
            //     to: phoneNumber
            // });

            // Simulate successful sending
            await this.delay(200); // Simulate network delay

            return {
                success: true,
                handler: this.name,
                metadata: {
                    to: phoneNumber,
                    message_length: message.length,
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
        return !!(this.twilioConfig.accountSid && 
                 this.twilioConfig.authToken && 
                 this.twilioConfig.fromNumber);
    }

    private formatSMSMessage(notification: Notification, user: User): string {
        // SMS messages should be concise due to length limits
        let message = `🌱 VeridianOS Alert\n\n${notification.title}\n\n${notification.message}`;

        // Add key details if available
        if (notification.sensorType && notification.value !== undefined) {
            message += `\n\n${notification.sensorType}: ${notification.value}${notification.unit || ''}`;
        }

        // Add severity for important alerts
        if (notification.severity === 'critical' || notification.severity === 'high') {
            message += `\n\nSeverity: ${notification.severity.toUpperCase()}`;
        }

        // Add timestamp
        const timeStr = notification.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        message += `\n\nTime: ${timeStr}`;

        // Truncate if too long (SMS limit is typically 160 characters for single SMS)
        if (message.length > 150) {
            message = message.substring(0, 147) + '...';
        }

        return message;
    }

    private parseChannels(channels?: string): string[] {
        if (!channels) return [];
        return channels.split(',').map(c => c.trim()).filter(Boolean);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
