// server/src/lib/notifications/NotificationManager.ts

import { getDbInstance } from '../../db/db';
import {
    User,
    UserSettings,
    Notification,
    NotificationHandler,
    NotificationResult,
    NotificationContext,
    NotificationMiddlewareOptions,
    NotificationType,
    NotificationSeverity
} from './types';

export class NotificationManager {
    private handlers: Map<string, NotificationHandler> = new Map();
    private options: NotificationMiddlewareOptions;
    private initialized = false;

    constructor(options: NotificationMiddlewareOptions) {
        this.options = {
            defaultSeverity: NotificationSeverity.NORMAL,
            maxRetries: 3,
            retryDelay: 1000,
            respectQuietHours: true,
            ...options
        };
    }

    /**
     * Initialize the notification manager and all handlers
     */
    async initialize(): Promise<void> {
        console.log('[NotificationManager] Initializing notification system...');
        
        // Register all handlers
        for (const handler of this.options.handlers) {
            await this.registerHandler(handler);
        }

        this.initialized = true;
        console.log(`[NotificationManager] Initialized with ${this.handlers.size} handlers`);
    }

    /**
     * Register a new notification handler
     */
    async registerHandler(handler: NotificationHandler): Promise<void> {
        try {
            // Initialize the handler if it has an initialize method
            if (handler.initialize) {
                await handler.initialize();
            }

            // Validate configuration if available
            if (handler.validateConfig) {
                const isValid = await handler.validateConfig();
                if (!isValid) {
                    console.warn(`[NotificationManager] Handler ${handler.name} configuration is invalid`);
                    handler.enabled = false;
                }
            }

            this.handlers.set(handler.type, handler);
            console.log(`[NotificationManager] Registered handler: ${handler.name} (${handler.type}) - ${handler.enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error(`[NotificationManager] Failed to register handler ${handler.name}:`, error);
        }
    }

    /**
     * Send notification to user based on their preferences
     */
    async notify(notification: Notification, userId?: number): Promise<NotificationResult[]> {
        if (!this.initialized) {
            throw new Error('NotificationManager not initialized. Call initialize() first.');
        }

        const results: NotificationResult[] = [];

        try {
            // Get user or use default (admin user)
            const user = userId ? await this.getUser(userId) : await this.getDefaultUser();
            if (!user) {
                console.warn('[NotificationManager] No user found for notification');
                return results;
            }

            // Load user settings
            user.settings = await this.getUserSettings(user.id);

            // Check if notifications are enabled for this user
            if (!this.areNotificationsEnabled(user, notification)) {
                console.log(`[NotificationManager] Notifications disabled for user ${user.username}`);
                return results;
            }

            // Check quiet hours
            if (this.options.respectQuietHours && this.isQuietHours(user)) {
                console.log(`[NotificationManager] Skipping notification during quiet hours for user ${user.username}`);
                return results;
            }

            // Get applicable handlers for this user and notification
            const applicableHandlers = await this.getApplicableHandlers(notification, user);
            
            console.log(`[NotificationManager] Sending notification "${notification.title}" to ${applicableHandlers.length} handlers`);

            // Send notification through each applicable handler
            for (const handler of applicableHandlers) {
                try {
                    const result = await this.sendWithRetry(handler, notification, user);
                    results.push(result);
                } catch (error) {
                    results.push({
                        success: false,
                        handler: handler.name,
                        error: (error as Error).message
                    });
                }
            }

            // Log results
            const successful = results.filter(r => r.success).length;
            console.log(`[NotificationManager] Notification sent: ${successful}/${results.length} handlers succeeded`);

        } catch (error) {
            console.error('[NotificationManager] Error sending notification:', error);
            results.push({
                success: false,
                handler: 'system',
                error: (error as Error).message
            });
        }

        return results;
    }

    /**
     * Send notification with retry logic
     */
    private async sendWithRetry(
        handler: NotificationHandler,
        notification: Notification,
        user: User,
        attempt = 1
    ): Promise<NotificationResult> {
        try {
            const result = await handler.send(notification, user);
            
            if (result.success) {
                console.log(`[NotificationManager] ${handler.name} sent successfully`);
                return result;
            } else if (attempt < this.options.maxRetries!) {
                console.warn(`[NotificationManager] ${handler.name} failed, retrying (${attempt}/${this.options.maxRetries})...`);
                await this.delay(this.options.retryDelay!);
                return this.sendWithRetry(handler, notification, user, attempt + 1);
            } else {
                console.error(`[NotificationManager] ${handler.name} failed after ${this.options.maxRetries} attempts`);
                return result;
            }
        } catch (error) {
            if (attempt < this.options.maxRetries!) {
                console.warn(`[NotificationManager] ${handler.name} threw error, retrying (${attempt}/${this.options.maxRetries})...`);
                await this.delay(this.options.retryDelay!);
                return this.sendWithRetry(handler, notification, user, attempt + 1);
            } else {
                throw error;
            }
        }
    }

    /**
     * Get applicable handlers for user and notification
     */
    private async getApplicableHandlers(notification: Notification, user: User): Promise<NotificationHandler[]> {
        const handlers: NotificationHandler[] = [];

        for (const [type, handler] of this.handlers) {
            if (!handler.enabled) continue;

            try {
                const canHandle = await handler.canHandle(notification, user);
                if (canHandle) {
                    handlers.push(handler);
                }
            } catch (error) {
                console.error(`[NotificationManager] Error checking handler ${handler.name}:`, error);
            }
        }

        return handlers;
    }

    /**
     * Check if notifications are enabled for user
     */
    private areNotificationsEnabled(user: User, notification: Notification): boolean {
        const settings = user.settings || {};
        
        // Global notification setting
        if (settings.notifications_enabled === 'false') {
            return false;
        }

        // Check notification types
        const enabledTypes = this.parseSettingArray(settings.notification_types);
        if (enabledTypes.length > 0 && !enabledTypes.includes(notification.type)) {
            return false;
        }

        return true;
    }

    /**
     * Check if current time is within quiet hours
     */
    private isQuietHours(user: User): boolean {
        const settings = user.settings || {};
        const quietStart = settings.quiet_hours_start;
        const quietEnd = settings.quiet_hours_end;

        if (!quietStart || !quietEnd) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMin] = quietStart.split(':').map(Number);
        const [endHour, endMin] = quietEnd.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        
        return currentTime >= startTime && currentTime <= endTime;
    }

    /**
     * Get user from database
     */
    private async getUser(userId: number): Promise<User | null> {
        try {
            const db = getDbInstance();
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
            return user || null;
        } catch (error) {
            console.error('[NotificationManager] Error fetching user:', error);
            return null;
        }
    }

    /**
     * Get default admin user
     */
    private async getDefaultUser(): Promise<User | null> {
        try {
            const db = getDbInstance();
            const user = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get() as User;
            return user || null;
        } catch (error) {
            console.error('[NotificationManager] Error fetching default user:', error);
            return null;
        }
    }

    /**
     * Get user settings from database
     */
    private async getUserSettings(userId: number): Promise<UserSettings> {
        try {
            const db = getDbInstance();
            const settings = db.prepare(`
                SELECT setting_key, setting_value 
                FROM user_settings 
                WHERE user_id = ?
            `).all(userId) as Array<{ setting_key: string; setting_value: string }>;

            const userSettings: UserSettings = {};
            settings.forEach(setting => {
                userSettings[setting.setting_key] = setting.setting_value;
            });

            return userSettings;
        } catch (error) {
            console.error('[NotificationManager] Error fetching user settings:', error);
            return {};
        }
    }

    /**
     * Parse comma-separated setting values
     */
    private parseSettingArray(setting?: string): string[] {
        if (!setting) return [];
        return setting.split(',').map(s => s.trim()).filter(Boolean);
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create notification object
     */
    static createNotification(
        type: NotificationType,
        title: string,
        message: string,
        options: Partial<Notification> = {}
    ): Notification {
        return {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity: NotificationSeverity.NORMAL,
            title,
            message,
            timestamp: new Date(),
            ...options
        };
    }

    /**
     * Cleanup all handlers
     */
    async cleanup(): Promise<void> {
        console.log('[NotificationManager] Cleaning up notification system...');
        
        for (const [type, handler] of this.handlers) {
            if (handler.cleanup) {
                try {
                    await handler.cleanup();
                } catch (error) {
                    console.error(`[NotificationManager] Error cleaning up handler ${handler.name}:`, error);
                }
            }
        }

        this.handlers.clear();
        this.initialized = false;
    }
}
