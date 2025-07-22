// server/src/api/notification-management-routes.ts
import { Router, Request, Response } from 'express';
import { getNotificationManager, NotificationManager, NotificationType, NotificationSeverity } from '../lib/notifications';

const router = Router();

// POST /api/notifications/test
// Endpoint to test notification system
router.post('/notifications/test', async (req: Request, res: Response) => {
    const { userId, type = 'test', severity = 'normal', title, message } = req.body;
    
    try {
        const notificationManager = await getNotificationManager();
        
        const notification = NotificationManager.createNotification(
            type as NotificationType || NotificationType.CUSTOM,
            title || 'Test Notification',
            message || 'This is a test notification from VeridianOS',
            {
                severity: severity as NotificationSeverity || NotificationSeverity.NORMAL,
                data: {
                    test: true,
                    sent_by: 'api',
                    timestamp: new Date().toISOString()
                }
            }
        );
        
        const results = await notificationManager.notify(notification, userId);
        
        res.json({
            message: 'Test notification sent',
            notification_id: notification.id,
            results: results
        });
    } catch (error) {
        console.error('[API] Error sending test notification:', error);
        res.status(500).json({ 
            message: 'Failed to send test notification', 
            error: (error as Error).message 
        });
    }
});

// GET /api/notifications/handlers
// Endpoint to get available notification handlers and their status
router.get('/notifications/handlers', async (req: Request, res: Response) => {
    try {
        const notificationManager = await getNotificationManager();
        
        // For now, we'll return static handler information
        // In a real implementation, you might want to expose handler status from the manager
        const handlers = [
            {
                type: 'database',
                name: 'Database Storage',
                enabled: true,
                description: 'Stores notifications in the database for in-app display',
                config_required: false
            },
            {
                type: 'email',
                name: 'Email Notifications',
                enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
                description: 'Sends notifications via email using SMTP',
                config_required: true,
                config_vars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
            },
            {
                type: 'sms',
                name: 'SMS Notifications',
                enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
                description: 'Sends SMS notifications via Twilio',
                config_required: true,
                config_vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']
            },
            {
                type: 'webhook',
                name: 'Webhook Notifications',
                enabled: true,
                description: 'Sends notifications to custom webhook URLs',
                config_required: false,
                user_config_required: ['webhook_url']
            }
        ];
        
        res.json({
            handlers: handlers,
            total_handlers: handlers.length,
            enabled_handlers: handlers.filter(h => h.enabled).length
        });
    } catch (error) {
        console.error('[API] Error fetching notification handlers:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notification handlers', 
            error: (error as Error).message 
        });
    }
});

// GET /api/notifications/settings/templates
// Endpoint to get notification setting templates for users
router.get('/notifications/settings/templates', (req: Request, res: Response) => {
    try {
        const templates = [
            {
                key: 'notifications_enabled',
                type: 'boolean',
                default: 'true',
                title: 'Enable Notifications',
                description: 'Master switch for all notifications'
            },
            {
                key: 'notification_channels',
                type: 'array',
                default: 'database,email',
                title: 'Notification Channels',
                description: 'Comma-separated list of channels to use',
                options: ['database', 'email', 'sms', 'webhook']
            },
            {
                key: 'notification_types',
                type: 'array',
                default: 'alert_created,system_error',
                title: 'Notification Types',
                description: 'Types of notifications to receive',
                options: ['alert_created', 'alert_dismissed', 'plant_created', 'plant_stage_changed', 'system_error']
            },
            {
                key: 'quiet_hours_start',
                type: 'time',
                default: '22:00',
                title: 'Quiet Hours Start',
                description: 'Time to stop sending notifications (24h format)'
            },
            {
                key: 'quiet_hours_end',
                type: 'time',
                default: '08:00',
                title: 'Quiet Hours End',
                description: 'Time to resume sending notifications (24h format)'
            },
            {
                key: 'email_notifications',
                type: 'boolean',
                default: 'true',
                title: 'Email Notifications',
                description: 'Receive notifications via email'
            },
            {
                key: 'sms_notifications',
                type: 'boolean',
                default: 'false',
                title: 'SMS Notifications',
                description: 'Receive notifications via SMS'
            },
            {
                key: 'phone_number',
                type: 'string',
                default: '',
                title: 'Phone Number',
                description: 'Phone number for SMS notifications (include country code)'
            },
            {
                key: 'webhook_notifications',
                type: 'boolean',
                default: 'false',
                title: 'Webhook Notifications',
                description: 'Send notifications to webhook URL'
            },
            {
                key: 'webhook_url',
                type: 'string',
                default: '',
                title: 'Webhook URL',
                description: 'URL to send webhook notifications to'
            },
            {
                key: 'webhook_auth_token',
                type: 'string',
                default: '',
                title: 'Webhook Auth Token',
                description: 'Bearer token for webhook authentication (optional)'
            }
        ];
        
        res.json({
            templates: templates,
            total_settings: templates.length
        });
    } catch (error) {
        console.error('[API] Error fetching setting templates:', error);
        res.status(500).json({ 
            message: 'Failed to fetch setting templates', 
            error: (error as Error).message 
        });
    }
});

export default router;
