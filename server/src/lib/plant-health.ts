// Plant Health Monitoring Configuration - Server Side
import { getDbInstance } from '../db/db';

export type HealthStatus = 'ideal' | 'ok' | 'dangerous';
export type PlantStage = 'seedling' | 'vegetative' | 'flowering';
export type SensorType = 'temperature' | 'humidity' | 'soil_moisture' | 'illuminance' | 'pressure';

export interface HealthRange {
  ideal?: { min: number; max: number };
  ok?: { min: number; max: number };
  // Everything else is considered dangerous
}

export interface PlantHealthConfig {
  name: string;
  stage: PlantStage;
  ranges: Record<SensorType, HealthRange>;
}

export interface Alert {
  id: number;
  timestamp: string;
  sensor_type: string;
  message: string;
  value: number;
  unit: string;
  dismissed: boolean;
  dismissed_at?: string;
  auto_dismissed: boolean;
  read: boolean;
}

// Default configuration for a general houseplant in vegetative stage
export const DEFAULT_PLANT_CONFIG: PlantHealthConfig = {
  name: "General Houseplant",
  stage: "vegetative",
  ranges: {
    temperature: {
      ideal: { min: 20, max: 26 },    // 20-26°C ideal
      ok: { min: 18, max: 30 },       // 18-30°C acceptable
      // <18°C or >30°C is dangerous
    },
    humidity: {
      ideal: { min: 50, max: 70 },    // 50-70% ideal
      ok: { min: 40, max: 80 },       // 40-80% acceptable
      // <40% or >80% is dangerous
    },
    soil_moisture: {
      ideal: { min: 40, max: 60 },    // 40-60% ideal
      ok: { min: 30, max: 80 },       // 30-80% acceptable
      // <30% or >80% is dangerous
    },
    illuminance: {
      ideal: { min: 200, max: 800 },  // 200-800 lux ideal
      ok: { min: 100, max: 1000 },    // 100-1000 lux acceptable
      // <100 or >1000 lux is dangerous
    },
    pressure: {
      ideal: { min: 1000, max: 1020 }, // 1000-1020 hPa ideal
      ok: { min: 980, max: 1040 },     // 980-1040 hPa acceptable
      // Outside this range is dangerous
    }
  }
};

// Function to determine health status for a sensor reading
export function getHealthStatus(
  sensorType: SensorType, 
  value: number, 
  config: PlantHealthConfig = DEFAULT_PLANT_CONFIG
): HealthStatus {
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
export function getStatusMessage(status: HealthStatus, sensorType: SensorType): string {
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
export function checkAndCreateAlerts(
  sensorData: Array<{ sensor_type: string; value: number; unit: string }>,
  config: PlantHealthConfig = DEFAULT_PLANT_CONFIG
): void {
  const db = getDbInstance();
  
  // Check if we already have active alerts for each sensor to avoid duplicates
  const activeAlertsQuery = db.prepare(`
    SELECT sensor_type, COUNT(*) as count 
    FROM alerts 
    WHERE dismissed = 0 
    GROUP BY sensor_type
  `);
  const activeAlerts = activeAlertsQuery.all() as Array<{ sensor_type: string; count: number }>;
  const activeAlertSensors = new Set(activeAlerts.map(a => a.sensor_type));
  
  const insertAlert = db.prepare(`
    INSERT INTO alerts (sensor_type, message, value, unit)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const sensor of sensorData) {
    const sensorType = sensor.sensor_type as SensorType;
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
export function getActiveAlerts(): Alert[] {
  const db = getDbInstance();
  const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 0 
    ORDER BY timestamp DESC
  `);
  return query.all() as Alert[];
}

// Function to dismiss an alert
export function dismissAlert(alertId: number, autoDismissed: boolean = false, markAsRead: boolean = false): boolean {
  const db = getDbInstance();
  
  // First check if the alert exists
  const checkQuery = db.prepare(`SELECT id, dismissed FROM alerts WHERE id = ?`);
  const existingAlert = checkQuery.get(alertId) as { id: number; dismissed: number } | undefined;
  
  if (!existingAlert) {
    console.warn(`[ALERT] Alert with ID ${alertId} not found`);
    return false;
  }
  
  if (existingAlert.dismissed === 1) {
    console.warn(`[ALERT] Alert with ID ${alertId} already dismissed`);
    return false;
  }
  
  // Update the alert
  const updateQuery = db.prepare(`
    UPDATE alerts 
    SET dismissed = 1, dismissed_at = CURRENT_TIMESTAMP, auto_dismissed = ?, read = ? 
    WHERE id = ?
  `);
  const result = updateQuery.run(autoDismissed ? 1 : 0, markAsRead ? 1 : 0, alertId);
  
  if (result.changes > 0) {
    console.log(`[ALERT] Successfully dismissed alert ${alertId} (auto: ${autoDismissed}, read: ${markAsRead})`);
  }
  
  return result.changes > 0;
}

// Function to get alert history
export function getAlertHistory(limit: number = 50): Alert[] {
  const db = getDbInstance();
  const query = db.prepare(`
    SELECT * FROM alerts 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return query.all(limit) as Alert[];
}

// Function to get the most recent active alert (for main notification display)
export function getLatestActiveAlert(): Alert | null {
  const db = getDbInstance();
  const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 0 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  const result = query.get() as Alert | undefined;
  return result || null;
}

// Function to get notification tray items (dismissed alerts that are unread)
export function getNotificationTrayItems(): Alert[] {
  const db = getDbInstance();
  const query = db.prepare(`
    SELECT * FROM alerts 
    WHERE dismissed = 1 AND read = 0 
    ORDER BY timestamp DESC
  `);
  return query.all() as Alert[];
}

// Function to mark an alert as read
export function markAlertAsRead(alertId: number): boolean {
  const db = getDbInstance();
  const query = db.prepare(`
    UPDATE alerts 
    SET read = 1 
    WHERE id = ?
  `);
  const result = query.run(alertId);
  return result.changes > 0;
}

// Function to get unread count for notification badge
export function getUnreadNotificationCount(): number {
  const db = getDbInstance();
  const query = db.prepare(`
    SELECT COUNT(*) as count 
    FROM alerts 
    WHERE dismissed = 1 AND read = 0
  `);
  const result = query.get() as { count: number };
  return result.count;
}

// Function to auto-dismiss oldest alerts if more than 3 active
export function autoManageAlerts(): void {
  const db = getDbInstance();
  
  // Get count of active alerts
  const countQuery = db.prepare(`SELECT COUNT(*) as count FROM alerts WHERE dismissed = 0`);
  const result = countQuery.get() as { count: number };
  
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
