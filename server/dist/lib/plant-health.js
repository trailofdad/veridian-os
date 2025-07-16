"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PLANT_CONFIG = void 0;
exports.getHealthStatus = getHealthStatus;
exports.getStatusMessage = getStatusMessage;
exports.checkAndCreateAlerts = checkAndCreateAlerts;
exports.getActiveAlerts = getActiveAlerts;
exports.dismissAlert = dismissAlert;
exports.getAlertHistory = getAlertHistory;
exports.getLatestActiveAlert = getLatestActiveAlert;
exports.getNotificationTrayItems = getNotificationTrayItems;
exports.markAlertAsRead = markAlertAsRead;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.autoManageAlerts = autoManageAlerts;
// Plant Health Monitoring Configuration - Server Side
const db_1 = require("../db/db");
// Default configuration for a general houseplant in vegetative stage
exports.DEFAULT_PLANT_CONFIG = {
    name: "General Houseplant",
    stage: "vegetative",
    ranges: {
        temperature: {
            ideal: { min: 20, max: 26 }, // 20-26°C ideal
            ok: { min: 18, max: 30 }, // 18-30°C acceptable
            // <18°C or >30°C is dangerous
        },
        humidity: {
            ideal: { min: 50, max: 70 }, // 50-70% ideal
            ok: { min: 40, max: 80 }, // 40-80% acceptable
            // <40% or >80% is dangerous
        },
        soil_moisture: {
            ideal: { min: 40, max: 60 }, // 40-60% ideal
            ok: { min: 30, max: 80 }, // 30-80% acceptable
            // <30% or >80% is dangerous
        },
        illuminance: {
            ideal: { min: 200, max: 800 }, // 200-800 lux ideal
            ok: { min: 100, max: 1000 }, // 100-1000 lux acceptable
            // <100 or >1000 lux is dangerous
        },
        pressure: {
            ideal: { min: 1000, max: 1020 }, // 1000-1020 hPa ideal
            ok: { min: 980, max: 1040 }, // 980-1040 hPa acceptable
            // Outside this range is dangerous
        }
    }
};
// Function to determine health status for a sensor reading
function getHealthStatus(sensorType, value, config = exports.DEFAULT_PLANT_CONFIG) {
    const range = config.ranges[sensorType];
    // If no range is configured, default to ideal (for display-only sensors)
    if (!range) {
        return 'ideal';
    }
    // Check if value is in ideal range
    if (range.ideal && value >= range.ideal.min && value <= range.ideal.max) {
        return 'ideal';
    }
    // Check if value is in ok range
    if (range.ok && value >= range.ok.min && value <= range.ok.max) {
        return 'ok';
    }
    // If no ranges are defined, default to ideal
    if (!range.ideal && !range.ok) {
        return 'ideal';
    }
    // Otherwise it's dangerous
    return 'dangerous';
}
// Function to get status message
function getStatusMessage(status, sensorType) {
    const sensorName = sensorType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    switch (status) {
        case 'ideal':
            return `${sensorName} is in the ideal range`;
        case 'ok':
            return `${sensorName} is acceptable but could be better`;
        case 'dangerous':
            return `${sensorName} is in a dangerous range! Immediate attention needed`;
    }
}
// Function to check sensor readings and create alerts for dangerous values
function checkAndCreateAlerts(sensorData, config = exports.DEFAULT_PLANT_CONFIG) {
    const db = (0, db_1.getDbInstance)();
    // Check if we already have active alerts for each sensor to avoid duplicates
    const activeAlertsQuery = db.prepare(`
    SELECT sensor_type, COUNT(*) as count 
    FROM alerts 
    WHERE dismissed = 0 
    GROUP BY sensor_type
  `);
    const activeAlerts = activeAlertsQuery.all();
    const activeAlertSensors = new Set(activeAlerts.map(a => a.sensor_type));
    const insertAlert = db.prepare(`
    INSERT INTO alerts (sensor_type, message, value, unit)
    VALUES (?, ?, ?, ?)
  `);
    for (const sensor of sensorData) {
        const sensorType = sensor.sensor_type;
        if (config.ranges[sensorType]) {
            const status = getHealthStatus(sensorType, sensor.value, config);
            // Only create alert if it's dangerous AND we don't already have an active alert for this sensor
            if (status === 'dangerous' && !activeAlertSensors.has(sensor.sensor_type)) {
                const message = getStatusMessage(status, sensorType);
                insertAlert.run(sensor.sensor_type, message, sensor.value, sensor.unit);
                console.log(`[ALERT] Created alert for ${sensor.sensor_type}: ${message}`);
            }
        }
    }
}
// Function to get all active alerts
function getActiveAlerts() {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 0 
    ORDER BY timestamp DESC
  `);
    return query.all();
}
// Function to dismiss an alert
function dismissAlert(alertId) {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    UPDATE alerts 
    SET dismissed = 1, dismissed_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND dismissed = 0
  `);
    const result = query.run(alertId);
    return result.changes > 0;
}
// Function to get alert history
function getAlertHistory(limit = 50) {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    SELECT * FROM alerts 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
    return query.all(limit);
}
// Function to get the most recent active alert (for main notification display)
function getLatestActiveAlert() {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 0 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
    const result = query.get();
    return result || null;
}
// Function to get notification tray items (dismissed alerts that are unread)
function getNotificationTrayItems() {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 1 AND read = 0 
    ORDER BY timestamp DESC
  `);
    return query.all();
}
// Function to mark an alert as read
function markAlertAsRead(alertId) {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    UPDATE alerts 
    SET read = 1 
    WHERE id = ?
  `);
    const result = query.run(alertId);
    return result.changes > 0;
}
// Function to get unread count for notification badge
function getUnreadNotificationCount() {
    const db = (0, db_1.getDbInstance)();
    const query = db.prepare(`
    SELECT COUNT(*) as count 
    FROM alerts 
    WHERE dismissed = 1 AND read = 0
  `);
    const result = query.get();
    return result.count;
}
// Function to auto-dismiss oldest alerts if more than 3 active
function autoManageAlerts() {
    const db = (0, db_1.getDbInstance)();
    // Get count of active alerts
    const countQuery = db.prepare(`SELECT COUNT(*) as count FROM alerts WHERE dismissed = 0`);
    const result = countQuery.get();
    if (result.count > 3) {
        // Auto-dismiss the oldest alerts to keep only 3 most recent
        const alertsToKeep = 3;
        const autoDismissQuery = db.prepare(`
      UPDATE alerts 
      SET dismissed = 1, dismissed_at = CURRENT_TIMESTAMP, auto_dismissed = 1 
      WHERE id IN (
        SELECT id FROM alerts 
        WHERE dismissed = 0 
        ORDER BY timestamp ASC 
        LIMIT ?
      )
    `);
        autoDismissQuery.run(result.count - alertsToKeep);
        console.log(`[ALERT] Auto-dismissed ${result.count - alertsToKeep} oldest alerts`);
    }
}
