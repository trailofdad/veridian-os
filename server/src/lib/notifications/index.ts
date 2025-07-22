// server/src/lib/notifications/index.ts

// Core types and manager
export * from './types';
export { NotificationManager } from './NotificationManager';

// Built-in handlers
export { DatabaseHandler } from './handlers/DatabaseHandler';
export { EmailHandler } from './handlers/EmailHandler';
export { SMSHandler } from './handlers/SMSHandler';
export { WebhookHandler } from './handlers/WebhookHandler';

// Convenience function to create a configured notification manager
import { NotificationManager } from './NotificationManager';
import { DatabaseHandler } from './handlers/DatabaseHandler';
import { EmailHandler } from './handlers/EmailHandler';
import { SMSHandler } from './handlers/SMSHandler';
import { WebhookHandler } from './handlers/WebhookHandler';

/**
 * Create a notification manager with default handlers
 */
export function createNotificationManager(): NotificationManager {
    const handlers = [
        new DatabaseHandler(),
        new EmailHandler(),
        new SMSHandler(),
        new WebhookHandler()
    ];

    return new NotificationManager({
        handlers,
        defaultSeverity: 'normal' as any,
        maxRetries: 3,
        retryDelay: 1000,
        respectQuietHours: true
    });
}

// Global notification manager instance (singleton pattern)
let globalNotificationManager: NotificationManager | null = null;

/**
 * Get the global notification manager instance
 */
export async function getNotificationManager(): Promise<NotificationManager> {
    if (!globalNotificationManager) {
        globalNotificationManager = createNotificationManager();
        await globalNotificationManager.initialize();
    }
    return globalNotificationManager;
}

/**
 * Cleanup the global notification manager
 */
export async function cleanupNotificationManager(): Promise<void> {
    if (globalNotificationManager) {
        await globalNotificationManager.cleanup();
        globalNotificationManager = null;
    }
}
