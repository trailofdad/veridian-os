# Notification & Alert API Routes

This document describes the notification and alert endpoints available in `server/src/api/notification-routes.ts`.

## Base URL
All endpoints are prefixed with `/api`

---

## 🚨 Alert Endpoints

### GET /alerts
Get all active alerts.

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2025-01-22T10:30:00Z",
    "sensor_type": "temperature",
    "message": "Temperature is too high",
    "value": 35.0,
    "unit": "°C",
    "dismissed": false,
    "plant_id": 1
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)

---

### POST /alerts/:id/dismiss
Dismiss an alert by ID.

**Path Parameters:**
- `id`: Alert ID

**Request Body:**
```json
{
  "auto_dismissed": false,  // optional
  "mark_as_read": true      // optional
}
```

**Response:**
```json
{
  "message": "Alert dismissed successfully."
}
```

**Status Codes:** 200 (OK), 400 (Invalid ID), 404 (Not Found), 500 (Error)

---

### GET /alerts/history
Get alert history.

**Query Parameters:**
- `limit`: Maximum number of results (default: 50)

**Response:** Array of historical alerts

**Status Codes:** 200 (OK), 500 (Error)

---

### GET /alerts/latest
Get the latest active alert for main notification display.

**Response:** Single alert object or null
```json
{
  "id": 1,
  "timestamp": "2025-01-22T10:30:00Z",
  "sensor_type": "temperature",
  "message": "Temperature is too high",
  "value": 35.0,
  "unit": "°C",
  "dismissed": false,
  "plant_id": 1
}
```

**Status Codes:** 200 (OK), 500 (Error)

---

## 🔔 Notification Endpoints

### GET /notifications/tray
Get notification tray items (dismissed but unread alerts).

**Response:** Array of notification objects
```json
[
  {
    "id": 2,
    "timestamp": "2025-01-22T09:15:00Z",
    "sensor_type": "humidity",
    "message": "Humidity is too low",
    "value": 25.0,
    "unit": "%",
    "dismissed": true,
    "dismissed_at": "2025-01-22T09:30:00Z",
    "read": false,
    "plant_id": 1
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)

---

### GET /notifications/unread-count
Get count of unread notifications for badge display.

**Response:**
```json
{
  "count": 3
}
```

**Status Codes:** 200 (OK), 500 (Error)

**Note:** This count includes both active alerts and dismissed but unread notifications.

---

### POST /notifications/:id/mark-read
Mark a notification as read.

**Path Parameters:**
- `id`: Alert/Notification ID

**Response:**
```json
{
  "message": "Notification marked as read."
}
```

**Status Codes:** 200 (OK), 400 (Invalid ID), 404 (Not Found), 500 (Error)

---

## Alert States and Workflow

### Alert Lifecycle
1. **Active**: Alert is created when sensor values exceed thresholds
2. **Dismissed**: User dismisses the alert (or auto-dismissed)
3. **Read**: User marks the notification as read

### State Combinations
- **Active + Unread**: Shows in main alert display
- **Dismissed + Unread**: Shows in notification tray
- **Dismissed + Read**: Hidden from UI but stored in history

### Auto-Dismissal
Some alerts can be automatically dismissed when conditions return to normal. These are marked with `auto_dismissed: true`.

---

## Error Response Format

All endpoints return errors in this format:
```json
{
  "message": "Error description",
  "error": "Detailed error message"  // optional
}
```

## Notes

- All timestamps are in ISO 8601 format
- Alerts are automatically created by the sensor data ingestion process
- Dismissing an alert doesn't delete it, just marks it as dismissed
- The notification system supports both manual and automatic alert management
- Plant-specific alerts include a `plant_id` field for targeted notifications
