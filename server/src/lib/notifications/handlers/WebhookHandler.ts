// server/src/lib/notifications/handlers/WebhookHandler.ts

import { NotificationHandler, Notification, User, NotificationResult } from '../types';

/**
 * Webhook notification handler for external integrations
 * Supports custom webhook URLs with configurable payloads
 */
export class WebhookHandler implements NotificationHandler {
    type = 'webhook';
    name = 'Webhook Notifications';
    enabled = true; // Can be enabled per user via webhook URL setting

    async canHandle(notification: Notification, user: User): Promise<boolean> {
        const settings = user.settings || {};
        
        // Check if user has webhook notifications enabled
        if (settings.webhook_notifications === 'false') {
            return false;
        }

        // Check if user wants notifications for this channel
        const enabledChannels = this.parseChannels(settings.notification_channels);
        if (enabledChannels.length > 0 && !enabledChannels.includes('webhook')) {
            return false;
        }

        // Require user to have a webhook URL
        return !!settings.webhook_url;
    }

    async send(notification: Notification, user: User): Promise<NotificationResult> {
        try {
            const settings = user.settings || {};
            const webhookUrl = settings.webhook_url;
            
            if (!webhookUrl) {
                throw new Error('No webhook URL found for user');
            }

            const payload = this.formatWebhookPayload(notification, user);
            const headers = this.getWebhookHeaders(settings);
            
            // For now, we'll simulate sending the webhook
            // In a real implementation, you would use fetch or axios
            console.log(`[WebhookHandler] Sending webhook to ${webhookUrl}:`, {
                url: webhookUrl,
                method: 'POST',
                headers: headers,
                payload: payload
            });

            // TODO: Implement actual HTTP request
            // const response = await fetch(webhookUrl, {
            //     method: 'POST',
            //     headers: headers,
            //     body: JSON.stringify(payload)
            // });
            // 
            // if (!response.ok) {
            //     throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
            // }

            // Simulate successful sending
            await this.delay(300); // Simulate network delay

            return {
                success: true,
                handler: this.name,
                metadata: {
                    webhook_url: this.sanitizeUrl(webhookUrl),
                    payload_size: JSON.stringify(payload).length,
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

    private formatWebhookPayload(notification: Notification, user: User) {
        // Standard webhook payload format
        const payload = {
            // Webhook metadata
            webhook: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                source: 'veridian-os'
            },
            
            // User information
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name
            },
            
            // Notification data
            notification: {
                id: notification.id,
                type: notification.type,
                severity: notification.severity,
                title: notification.title,
                message: notification.message,
                timestamp: notification.timestamp.toISOString(),
                data: notification.data || {}
            },
            
            // Plant/sensor specific data if available
            ...(notification.plantId && { plant_id: notification.plantId }),
            ...(notification.sensorType && { 
                sensor: {
                    type: notification.sensorType,
                    value: notification.value,
                    unit: notification.unit
                }
            })
        };

        return payload;
    }

    private getWebhookHeaders(settings: Record<string, any>): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'VeridianOS-Webhook/1.0'
        };

        // Add custom headers if specified
        const customHeaders = settings.webhook_headers;
        if (customHeaders) {
            try {
                const parsed = typeof customHeaders === 'string' 
                    ? JSON.parse(customHeaders) 
                    : customHeaders;
                Object.assign(headers, parsed);
            } catch (error) {
                console.warn('[WebhookHandler] Invalid webhook headers format:', error);
            }
        }

        // Add authentication if specified
        const authToken = settings.webhook_auth_token;
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const authHeader = settings.webhook_auth_header;
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        return headers;
    }

    private sanitizeUrl(url: string): string {
        // Remove sensitive information from URL for logging
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        } catch {
            return '[invalid-url]';
        }
    }

    private parseChannels(channels?: string): string[] {
        if (!channels) return [];
        return channels.split(',').map(c => c.trim()).filter(Boolean);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async validateConfig(): Promise<boolean> {
        // Webhook handler doesn't need global configuration
        // Validation is done per-user based on webhook_url setting
        return true;
    }
}
