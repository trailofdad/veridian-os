import { useState, useEffect } from 'react';
import { Card, Text, Badge, Button } from '@tremor/react';
import { apiCall, API_ENDPOINTS } from '@/lib/api-config';

interface ServerAlert {
  id: number;
  timestamp: string;
  sensor_type: string;
  message: string;
  value: number;
  unit: string;
  dismissed: boolean;
  dismissed_at?: string;
}

interface AlertNotificationProps {
  // Remove dependency on sensorData, alerts are now server-managed
}

export const AlertNotification: React.FC<AlertNotificationProps> = () => {
  const [alerts, setAlerts] = useState<ServerAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.ALERTS);
      const alertsData = await response.json();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (alertId: number) => {
    try {
      await apiCall(API_ENDPOINTS.DISMISS_ALERT(alertId), {
        method: 'POST',
      });
      // Remove the dismissed alert from the state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚨</span>
            <Text className="text-lg font-semibold text-red-700 dark:text-red-300">
              Plant Health Alert
            </Text>
          </div>
          <Badge color="red" size="sm">
            {activeAlerts.length} Issue{activeAlerts.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {activeAlerts.map((alert, index) => (
            <div 
              key={`${alert.sensor_type}-${index}`}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="flex-1">
                <Text className="font-medium text-red-700 dark:text-red-300">
                  {alert.sensor_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {alert.message}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current value: {alert.value.toFixed(1)} {alert.unit}
                </Text>
              </div>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => handleDismiss(alert.id)}
              >
                Dismiss
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
