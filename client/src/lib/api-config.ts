// API Configuration for different environments

export const getApiBaseUrl = (): string => {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    // Browser environment - use the correct port mapping
    const { protocol, hostname, port } = window.location;
    
    // If running through nginx (production), use the same host
    if (protocol === 'https:' || hostname !== 'localhost') {
      return `${protocol}//${hostname}`;
    }
    
    // Local development: if client is on 3000, server is on 3001
    if (port === '3000') {
      return `${protocol}//${hostname}:3001`;
    }
    
    // Docker development: use localhost:8000 (Docker mapped port)
    return `${protocol}//${hostname}:8000`;
  }
  
  // Server-side rendering fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
