import { useState, useEffect } from 'react';
import { Text, Button } from '@tremor/react';
import { apiCall, API_ENDPOINTS } from '@/lib/api-config';
import { formatToADT } from '@/utils/format-date';
import { createElement } from 'react';
import { RiAlertFill, RiCheckLine } from '@remixicon/react';

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
  const [animationClass, setAnimationClass] = useState('');
  const [autoDismissTimeout, setAutoDismissTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchLatestAlert = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.LATEST_ALERT);
      const alert = await response.json();
      
      // Clear any existing timeout
      if (autoDismissTimeout) {
        clearTimeout(autoDismissTimeout);
      }
      
      if (alert && alert.id) {
        // Only update if it's a different alert to prevent race conditions
        if (!latestAlert || latestAlert.id !== alert.id) {
          setLatestAlert(alert);
          setVisible(true); // Show toast when new alert is fetched
          setAnimationClass(''); // Reset animation class for new alert
          
          // Set auto-dismiss after 10 seconds
          const timeout = setTimeout(() => {
            handleAutoDismiss(alert.id);
          }, 10000);
          setAutoDismissTimeout(timeout);
        }
      } else {
        // No alert available, hide the notification
        setLatestAlert(null);
        setVisible(false);
        setAnimationClass('');
      }
    } catch (error) {
      console.error('Error fetching latest alert:', error);
      setLatestAlert(null);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestAlert();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLatestAlert, 30000);
    return () => {
      clearInterval(interval);
      if (autoDismissTimeout) {
        clearTimeout(autoDismissTimeout);
      }
    };
  }, []);

  const handleDismissAlert = async (alertId: number) => {
    try {
      // Clear auto-dismiss timeout since user manually dismissed
      if (autoDismissTimeout) {
        clearTimeout(autoDismissTimeout);
        setAutoDismissTimeout(null);
      }
      
      // Apply swipe right animation
      setAnimationClass('animate-swipe-right');
      
      // Wait for animation to complete, then dismiss and refresh
      setTimeout(async () => {
        try {
          const response = await apiCall(API_ENDPOINTS.DISMISS_ALERT(alertId), {
            method: 'POST',
            body: JSON.stringify({ mark_as_read: true }),
          });
          setVisible(false);
          await fetchLatestAlert();
        } catch (error) {
          console.error('Error dismissing alert:', error);
          // If the alert is already dismissed (404), just hide the notification
          if (error instanceof Error && error.message.includes('404')) {
            setVisible(false);
            await fetchLatestAlert();
          }
        }
      }, 300);
    } catch (error) {
      console.error('Error starting dismiss animation:', error);
    }
  };

  const handleAutoDismiss = async (alertId: number) => {
    try {
      // Apply particle fade animation
      setAnimationClass('animate-particle-fade');
      
      // Wait for animation to complete, then auto-dismiss and refresh
      setTimeout(async () => {
        try {
          await apiCall(API_ENDPOINTS.DISMISS_ALERT(alertId), {
            method: 'POST',
            body: JSON.stringify({ auto_dismissed: true }),
          });
          setVisible(false);
          setAutoDismissTimeout(null);
          await fetchLatestAlert();
        } catch (error) {
          console.error('Error auto-dismissing alert:', error);
          // If the alert is already dismissed (404), just hide the notification
          if (error instanceof Error && error.message.includes('404')) {
            setVisible(false);
            setAutoDismissTimeout(null);
            await fetchLatestAlert();
          }
        }
      }, 600); // Particle fade animation is longer (0.6s)
    } catch (error) {
      console.error('Error starting auto-dismiss animation:', error);
    }
  };

  const handleManualDismiss = () => {
    if (latestAlert) {
      handleDismissAlert(latestAlert.id);
    }
  };

  if (loading || !latestAlert || !visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-top-2 duration-300 ${animationClass}`}>
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
            <button
              onClick={handleManualDismiss}
              className="p-1 hover:bg-purple-600/20 rounded transition-colors"
              title="Mark as read"
            >
              {createElement(RiCheckLine, { className: "w-4 h-4 text-purple-300" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
