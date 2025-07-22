# VeridianOS Notification System

A comprehensive, extensible notification middleware system that supports multiple delivery channels and user preferences.

## 🏗️ Architecture Overview

The notification system is built with a plugin-based architecture that allows for easy extension and configuration:

```
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐
│   Alert/Event   │───▶│ NotificationManager │───▶│   Handlers      │
└─────────────────┘    └───────────────────┘    └─────────────────┘
                                │                         │
                                │                         ├─ Database
                                ▼                         ├─ Email
                       ┌─────────────────┐               ├─ SMS  
                       │ User Preferences │               └─ Webhook
                       └─────────────────┘

```

## 🎯 Key Features

### **Flexible Handler System**
- **Database Handler**: Maintains current in-app notifications
- **Email Handler**: SMTP-based email notifications with HTML templates
- **SMS Handler**: Twilio-based SMS notifications with character limits
- **Webhook Handler**: Custom integrations with external systems

### **User Preference Management**
- **Channel Selection**: Choose which notification methods to use
- **Quiet Hours**: Configurable time periods to suppress notifications
- **Type Filtering**: Control which types of notifications to receive
- **Per-Handler Settings**: Individual configuration for each notification type

### **Intelligent Delivery**
- **Retry Logic**: Automatic retries with exponential backoff
- **Severity-based Routing**: Critical alerts can bypass quiet hours
- **Duplicate Prevention**: Avoids sending redundant notifications
- **Graceful Degradation**: System continues working if handlers fail

## 📚 Core Components

### **NotificationManager**
The central orchestrator that manages handlers, user preferences, and delivery logic.

```typescript
const manager = await getNotificationManager();
await manager.notify(notification, userId);
```

### **Notification Handlers**
Pluggable components that handle delivery to specific channels:

```typescript
interface NotificationHandler {
  type: string;
  name: string;
  enabled: boolean;
  canHandle(notification, user): Promise<boolean>;
  send(notification, user): Promise<NotificationResult>;
}
```

### **User Settings Integration**
Leverages the existing user settings system for preferences:

```json
{
  "notifications_enabled": "true",
  "notification_channels": "database,email",
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "email_notifications": "true",
  "sms_notifications": "false"
}
```

## 🚀 Quick Start

### **1. Environment Configuration**

For **Email Notifications**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="VeridianOS <noreply@veridianos.ca>"
```

For **SMS Notifications**:
```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

### **2. User Settings Configuration**

Configure user preferences via API:
```bash
# Enable email notifications
PUT /api/users/1/settings/email_notifications
Body: {"value": "true"}

# Set notification channels
PUT /api/users/1/settings/notification_channels
Body: {"value": "database,email,sms"}

# Configure quiet hours
PUT /api/users/1/settings/quiet_hours_start
Body: {"value": "22:00"}
```

### **3. Testing the System**

```bash
# Send a test notification
POST /api/notifications/test
Body: {
  "userId": 1,
  "title": "Test Alert",
  "message": "This is a test notification",
  "severity": "high"
}
```

## 📋 API Endpoints

### **Notification Management**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/test` | POST | Send test notification |
| `/api/notifications/handlers` | GET | List available handlers and status |
| `/api/notifications/settings/templates` | GET | Get setting templates for UI |

### **User Preferences** (via existing user API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:id/settings` | GET | Get user notification settings |
| `/api/users/:id/settings/:key` | PUT | Update specific setting |
| `/api/users/:id/settings/:key` | DELETE | Remove setting |

## 🔧 Handler Configuration

### **Email Handler**
- **Requirements**: SMTP server credentials
- **Features**: HTML email templates, severity-based styling
- **User Settings**: `email_notifications`, user must have email address

### **SMS Handler**
- **Requirements**: Twilio account and phone number
- **Features**: Concise messages, character limit handling
- **User Settings**: `sms_notifications`, `phone_number`

### **Webhook Handler**
- **Requirements**: None (per-user configuration)
- **Features**: Custom payloads, authentication support
- **User Settings**: `webhook_url`, `webhook_auth_token`

### **Database Handler**
- **Requirements**: None (uses existing database)
- **Features**: Maintains current in-app notification system
- **User Settings**: Always enabled

## 🛠️ Creating Custom Handlers

```typescript
import { NotificationHandler, Notification, User, NotificationResult } from '../types';

export class CustomHandler implements NotificationHandler {
  type = 'custom';
  name = 'Custom Notifications';
  enabled = true;

  async canHandle(notification: Notification, user: User): Promise<boolean> {
    // Check if this handler should process the notification
    const settings = user.settings || {};
    return settings.custom_notifications === 'true';
  }

  async send(notification: Notification, user: User): Promise<NotificationResult> {
    try {
      // Your custom notification logic here
      console.log('Sending custom notification:', notification.title);
      
      return {
        success: true,
        handler: this.name,
        metadata: { sent_at: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        handler: this.name,
        error: (error as Error).message
      };
    }
  }
}

// Register the handler
const handlers = [
  // ... existing handlers
  new CustomHandler()
];
```

## 📊 Monitoring and Logging

The notification system provides comprehensive logging:

```
[NotificationManager] Initializing notification system...
[EmailHandler] SMTP configuration found, email notifications enabled
[SMSHandler] No Twilio configuration found, SMS notifications disabled
[NotificationManager] Registered handler: Email Notifications (email) - enabled
[NotificationManager] Sending notification "Plant Alert: TEMPERATURE" to 2 handlers
[EmailHandler] Sending email to admin@veridianos.ca
[NotificationManager] Email Notifications sent successfully
[NotificationManager] Notification sent: 2/2 handlers succeeded
```

## 🔄 Integration Points

### **Plant Health System**
Automatically triggers notifications when sensor readings are dangerous:

```typescript
// In plant-health.ts
if (status === 'dangerous') {
  await sendAlertNotification({
    alertId: result.lastInsertRowid,
    sensorType: sensor.sensor_type,
    message,
    value: sensor.value,
    unit: sensor.unit
  });
}
```

### **User Settings API**
Leverages existing user settings for configuration without additional database changes.

### **Alert Management**
Integrates with existing alert dismissal and notification tray systems.

## 🚀 Future Enhancements

### **Planned Features**
1. **Push Notifications**: Web push notifications for browsers
2. **Discord/Slack Integration**: Built-in handlers for popular platforms
3. **Advanced Scheduling**: Recurring notifications and maintenance reminders
4. **Template System**: Customizable notification templates
5. **Analytics**: Delivery success tracking and user engagement metrics

### **Advanced User Preferences**
1. **Severity-based Routing**: Different channels for different alert severities
2. **Plant-specific Settings**: Per-plant notification preferences
3. **Digest Notifications**: Daily/weekly summary emails
4. **Escalation Rules**: Progressive notification escalation

## 🔒 Security Considerations

- **Environment Variables**: Sensitive credentials stored in environment variables
- **User Data Protection**: Webhook URLs and tokens stored securely
- **Rate Limiting**: Built-in retry logic prevents API abuse
- **Validation**: Input validation on all notification endpoints
- **Graceful Failures**: System continues operating if handlers fail

## 🎯 Best Practices

### **For Users**
1. **Test Notifications**: Use the test endpoint to verify configuration
2. **Set Quiet Hours**: Configure appropriate quiet periods
3. **Choose Channels Wisely**: Balance urgency with convenience
4. **Monitor Settings**: Regularly review and update preferences

### **For Developers**
1. **Handler Development**: Follow the NotificationHandler interface
2. **Error Handling**: Always return proper NotificationResult objects
3. **Configuration**: Use environment variables for sensitive data
4. **Logging**: Provide meaningful logs for troubleshooting
5. **Testing**: Test both success and failure scenarios

---

This notification system provides a robust, extensible foundation for keeping users informed about their plant monitoring system while maintaining flexibility for future enhancements and custom integrations.
