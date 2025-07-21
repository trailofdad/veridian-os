// API Configuration for different environments
export const getApiBaseUrl = (): string => {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    // Browser environment - use environment variable if set
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      return apiUrl;
    }

    // Use same hostname as client, port 3001 for API
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }
  
  // Server-side rendering fallback for Docker internal communication
  return process.env.NEXT_PUBLIC_API_URL || 'http://server:3001';
};

export const API_ENDPOINTS = {
  LATEST_SENSORS: '/api/latest-sensors',
  SENSOR_DATA: '/api/sensor-data',
  SENSOR_HISTORY: (sensorType: string) => `/api/sensor-history/${sensorType}`,
  ALERTS: '/api/alerts',
  LATEST_ALERT: '/api/alerts/latest',
  DISMISS_ALERT: (alertId: number) => `/api/alerts/${alertId}/dismiss`,
  ALERT_HISTORY: '/api/alerts/history',
  NOTIFICATION_TRAY: '/api/notifications/tray',
  UNREAD_COUNT: '/api/notifications/unread-count',
  MARK_READ: (alertId: number) => `/api/notifications/${alertId}/mark-read`,
  // Plant Management
  PLANTS: '/api/plants',
  PLANT: (plantId: number) => `/api/plants/${plantId}`,
  PLANT_STAGES: '/api/plant-stages',
  PLANT_SENSOR_DATA: (plantId: number) => `/api/plants/${plantId}/sensor-data`,
} as const;

// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};
