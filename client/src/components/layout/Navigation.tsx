import { useState, useEffect } from 'react';
import { Card, Text, Badge, Button, Flex } from '@tremor/react';
import { apiCall, API_ENDPOINTS } from '@/lib/api-config';
import { formatToADT } from '@/utils/format-date';
import React from 'react';
import { 
  RiPlantLine,
  RiBellLine,
  RiCloseLine,
  RiCheckLine,
  RiCheckDoubleLine,
  RiDashboardLine,
  RiSettings4Line,
  RiHistoryLine,
  RiCheckboxCircleLine,
  RiThermometerLine,
  RiDropLine,
  RiWindyLine,
  RiSunLine,
  RiAlarmWarningLine
} from '@remixicon/react';

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

interface NavigationProps {
  // Future props can be added here
}

export const Navigation: React.FC<NavigationProps> = () => {
  const [notificationTray, setNotificationTray] = useState<ServerAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTray, setShowTray] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotificationTray = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.NOTIFICATION_TRAY);
      const trayItems = await response.json();
      setNotificationTray(trayItems);
    } catch (error) {
      console.error('Error fetching notification tray:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.UNREAD_COUNT);
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotificationData = async () => {
    await Promise.all([
      fetchNotificationTray(),
      fetchUnreadCount(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotificationData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotificationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await apiCall(API_ENDPOINTS.MARK_READ(alertId), {
        method: 'POST',
      });
      // Remove from notification tray and update count
      setNotificationTray(prev => prev.filter(item => item.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all notifications as read
      await Promise.all(
        notificationTray.map(item => 
          apiCall(API_ENDPOINTS.MARK_READ(item.id), { method: 'POST' })
        )
      );
      setNotificationTray([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Helper to get sensor icon
  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'temperature':
        return RiThermometerLine;
      case 'humidity':
        return RiDropLine;
      case 'pressure':
        return RiWindyLine;
      case 'illuminance':
        return RiSunLine;
      case 'soil_moisture':
        return RiPlantLine;
      default:
        return RiAlarmWarningLine;
    }
  };

  // Close tray when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTray && !target.closest('.notification-tray')) {
        setShowTray(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTray]);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 shadow-lg shadow-black/10 dark:shadow-black/25 border-b border-white/20 dark:border-gray-700/30 supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Flex justifyContent="between" alignItems="center" className="h-16">
          {/* Logo/Brand and Navigation Links */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="text-violet-500 dark:text-violet-400">
                {React.createElement(RiPlantLine, { className: "w-7 h-7" })}
              </div>
              <Text className="text-xl font-bold text-tremor-brand dark:text-dark-tremor-brand">
                VeridianOS
              </Text>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Button
                variant="light"
                size="sm"
                className="text-tremor-content dark:text-dark-tremor-content hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                Dashboard
              </Button>
              <Button
                variant="light"
                size="sm"
                className="text-tremor-content dark:text-dark-tremor-content hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                Settings
              </Button>
              <Button
                variant="light"
                size="sm"
                className="text-tremor-content dark:text-dark-tremor-content hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                History
              </Button>
            </div>
          </div>

          {/* Notification Tray */}
          <div className="relative notification-tray">
            <Button
              variant="light"
              size="sm"
              onClick={() => setShowTray(!showTray)}
              className="relative p-2 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              <div className="text-violet-500 dark:text-violet-400">
                {React.createElement(RiBellLine, { className: "w-5 h-5" })}
              </div>
              {unreadCount > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Button>

            {/* Notification Dropdown */}
            {showTray && (
              <div className="absolute right-0 mt-2 w-96 backdrop-blur-md bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg shadow-black/10 dark:shadow-black/30 border border-gray-200/50 dark:border-gray-700/50 z-50">
                <div className="p-4">
                  <Flex justifyContent="between" alignItems="center" className="mb-4">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </Text>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="light"
                          size="xs"
                          onClick={handleMarkAllAsRead}
                          className="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => setShowTray(false)}
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-1"
                      >
                        <div className="text-gray-500 dark:text-gray-400">
                          {React.createElement(RiCloseLine, { className: "w-4 h-4" })}
                        </div>
                      </Button>
                    </div>
                  </Flex>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Text className="text-gray-500 dark:text-gray-400">Loading...</Text>
                    </div>
                  ) : notificationTray.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-violet-500 dark:text-violet-400 mb-2">
                        {React.createElement(RiCheckboxCircleLine, { className: "w-8 h-8" })}
                      </div>
                      <Text className="text-gray-500 dark:text-gray-400">
                        No new notifications
                      </Text>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notificationTray.map((item) => {
                        const SensorIcon = getSensorIcon(item.sensor_type);
                        return (
                          <Card
                            key={item.id}
                            className={`p-3 backdrop-blur-sm ${
                              item.auto_dismissed
                                ? 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200/60 dark:border-yellow-800/60'
                                : 'bg-gray-50/80 dark:bg-gray-700/80 border-gray-200/60 dark:border-gray-600/60'
                            }`}
                          >
                            <Flex justifyContent="between" alignItems="start" className="gap-3">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <div className="text-violet-500 dark:text-violet-400 mt-0.5">
                                  {React.createElement(SensorIcon, { className: "w-4 h-4" })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Flex alignItems="center" className="gap-2 mb-1">
                                    <Text className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                      {item.sensor_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Text>
                                    {item.auto_dismissed && (
                                      <Badge color="yellow" size="xs">
                                        Auto-dismissed
                                      </Badge>
                                    )}
                                  </Flex>
                                  <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {item.message}
                                  </Text>
                                  <Text className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatToADT(item.timestamp)} • {item.value.toFixed(1)} {item.unit}
                                  </Text>
                                </div>
                              </div>
                              <Button
                                variant="light"
                                size="xs"
                                onClick={() => handleMarkAsRead(item.id)}
                                className="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 shrink-0 p-1"
                              >
                                <div className="text-violet-500 dark:text-violet-400">
                                  {React.createElement(RiCheckLine, { className: "w-3 h-3" })}
                                </div>
                              </Button>
                            </Flex>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Flex>
      </div>
    </nav>
  );
};
