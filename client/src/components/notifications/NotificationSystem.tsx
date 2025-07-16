import { useState, useEffect } from 'react';
import { Text, Button } from '@tremor/react';
import { apiCall, API_ENDPOINTS } from '@/lib/api-config';
import { formatToADT } from '@/utils/format-date';
import { createElement } from 'react';
import { RiAlertFill, RiCloseLine } from '@remixicon/react';

interface ServerAlert {
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

interface NotificationSystemProps {
  // Empty for now
}

export const NotificationSystem: React.FC<NotificationSystemProps> = () => {
  const [latestAlert, setLatestAlert] = useState<ServerAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  const fetchLatestAlert = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.LATEST_ALERT);
      const alert = await response.json();
      setLatestAlert(alert);
      setVisible(true); // Show toast when new alert is fetched
    } catch (error) {
      console.error('Error fetching latest alert:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestAlert();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLatestAlert, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissAlert = async (alertId: number) => {
    try {
      await apiCall(API_ENDPOINTS.DISMISS_ALERT(alertId), {
        method: 'POST',
      });
      // Hide toast and refresh data after dismissing
      setVisible(false);
      await fetchLatestAlert();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleDismissToast = () => {
    setVisible(false);
  };

  if (loading || !latestAlert || !visible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-md border border-purple-300/20 rounded-lg p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {createElement(RiAlertFill, { className: "w-5 h-5 text-purple-400 flex-shrink-0" })}
            <div className="flex-1">
              <Text className="text-sm font-medium text-purple-100">
                {latestAlert.sensor_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text className="text-xs text-purple-200/80 mt-1">
                {latestAlert.message}
              </Text>
              <Text className="text-xs text-purple-300/60 mt-1">
                {latestAlert.value.toFixed(1)} {latestAlert.unit} • {formatToADT(latestAlert.timestamp)}
              </Text>
            </div>
          </div>
          <div className="flex space-x-1 ml-2">
            <Button
              size="xs"
              variant="light"
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border-purple-400/30"
              onClick={() => handleDismissAlert(latestAlert.id)}
            >
              Dismiss
            </Button>
            <button
              onClick={handleDismissToast}
              className="p-1 hover:bg-purple-600/20 rounded transition-colors"
            >
              {createElement(RiCloseLine, { className: "w-4 h-4 text-purple-300" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
