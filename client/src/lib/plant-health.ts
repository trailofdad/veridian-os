// Plant Health Monitoring Configuration

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

// Function to get color configuration for Tremor UI based on health status
export function getHealthColors(status: HealthStatus) {
  switch (status) {
    case 'ideal':
      return {
        decoration: 'emerald' as const,
        text: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-950',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'emerald' as const,
        icon: 'text-emerald-600'
      };
    case 'ok':
      return {
        decoration: 'yellow' as const,
        text: 'text-yellow-700 dark:text-yellow-300',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'yellow' as const,
        icon: 'text-yellow-600'
      };
    case 'dangerous':
      return {
        decoration: 'red' as const,
        text: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        badge: 'red' as const,
        icon: 'text-red-600'
      };
  }
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

// Function to get status icon
export function getStatusIcon(status: HealthStatus): string {
  switch (status) {
    case 'ideal':
      return '✅';
    case 'ok':
      return '⚠️';
    case 'dangerous':
      return '🚨';
  }
}

// Function to check if any sensors are in dangerous range
export function getDangerousAlerts(
  sensorData: Array<{ sensor_type: string; value: number; unit: string }>,
  config: PlantHealthConfig = DEFAULT_PLANT_CONFIG
): Array<{ sensor: string; message: string; value: number; unit: string }> {
  const alerts: Array<{ sensor: string; message: string; value: number; unit: string }> = [];
  
  for (const sensor of sensorData) {
    const sensorType = sensor.sensor_type as SensorType;
    if (config.ranges[sensorType]) {
      const status = getHealthStatus(sensorType, sensor.value, config);
      if (status === 'dangerous') {
        alerts.push({
          sensor: sensor.sensor_type,
          message: getStatusMessage(status, sensorType),
          value: sensor.value,
          unit: sensor.unit
        });
      }
    }
  }
  
  return alerts;
}
