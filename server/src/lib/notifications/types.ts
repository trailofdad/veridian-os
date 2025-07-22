// server/src/lib/notifications/types.ts

export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    settings?: UserSettings;
}

export interface UserSettings {
    [key: string]: any;
    notifications_enabled?: string;
    notification_channels?: string;
    notification_types?: string;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    email_notifications?: string;
    sms_notifications?: string;
    push_notifications?: string;
    webhook_url?: string;
}

export interface Notification {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    message: string;
    data?: Record<string, any>;
    timestamp: Date;
    userId?: number;
    plantId?: number;
    sensorType?: string;
    value?: number;
    unit?: string;
}

export enum NotificationType {
    ALERT_CREATED = 'alert_created',
    ALERT_DISMISSED = 'alert_dismissed',
    PLANT_CREATED = 'plant_created',
    PLANT_STAGE_CHANGED = 'plant_stage_changed',
    SYSTEM_ERROR = 'system_error',
    CUSTOM = 'custom'
}

export enum NotificationSeverity {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface NotificationResult {
    success: boolean;
    handler: string;
    error?: string;
    metadata?: Record<string, any>;
}

export interface NotificationHandler {
    type: string;
    name: string;
    enabled: boolean;
    
    /**
     * Check if this handler can process the notification for the given user
     */
    canHandle(notification: Notification, user: User): Promise<boolean>;
    
    /**
     * Send the notification
     */
    send(notification: Notification, user: User): Promise<NotificationResult>;
    
    /**
     * Validate configuration for this handler
     */
    validateConfig?(): Promise<boolean>;
    
    /**
     * Initialize the handler (setup connections, validate API keys, etc.)
     */
    initialize?(): Promise<void>;
    
    /**
     * Cleanup resources
     */
    cleanup?(): Promise<void>;
}

export interface NotificationMiddlewareOptions {
    handlers: NotificationHandler[];
    defaultSeverity?: NotificationSeverity;
    enabledChannels?: string[];
    maxRetries?: number;
    retryDelay?: number;
    respectQuietHours?: boolean;
}

export interface NotificationContext {
    user: User;
    notification: Notification;
    handlers: NotificationHandler[];
    results: NotificationResult[];
}
