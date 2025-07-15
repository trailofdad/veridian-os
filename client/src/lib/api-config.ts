// API Configuration for different environments

export const getApiBaseUrl = (): string => {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    // Browser environment - use the correct port mapping
    // In development: server container exposes port 8000
    // In production: server container exposes port 8000 (or nginx on 80)
    const { protocol, hostname } = window.location;
    
    // If running through nginx (production), use the same host
    if (protocol === 'https:' || hostname !== 'localhost') {
      return `${protocol}//${hostname}`;
    }
    
    // Development: use localhost:8000 (Docker mapped port)
    return `${protocol}//${hostname}:8000`;
  }
  
  // Server-side rendering fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_ENDPOINTS = {
  LATEST_SENSORS: '/api/latest-sensors',
  SENSOR_DATA: '/api/sensor-data',
  SENSOR_HISTORY: (sensorType: string) => `/api/sensor-history/${sensorType}`,
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
