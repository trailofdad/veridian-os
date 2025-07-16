"use client";

import { useState, useEffect } from 'react';
import { Card, Text, Button, Badge, Flex } from '@tremor/react';
import { RiCloseLine, RiAlarmWarningLine, RiCheckboxCircleLine, RiInformationLine, RiErrorWarningLine } from '@remixicon/react';

interface AlertData {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  is_persistent: boolean;
  auto_dismissed: boolean;
}

export const ToastNotification = () => {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch the main alert from your API
    const fetchMainAlert = async () => {
      try {
        const response = await fetch('/api/alerts/main');
        if (response.ok) {
          const alertData = await response.json();
          if (alertData) {
            setAlert(alertData);
            setIsVisible(true);
            
            // Auto-dismiss after 5 seconds for non-persistent alerts
            if (!alertData.is_persistent) {
              setTimeout(() => {
                handleDismiss();
              }, 5000);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch main alert:', error);
      }
    };

    fetchMainAlert();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchMainAlert, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Mark alert as dismissed in the backend
    if (alert) {
      fetch(`/api/alerts/${alert.id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(error => console.error('Failed to dismiss alert:', error));
    }
    
    // Clear the alert after animation completes
    setTimeout(() => setAlert(null), 300);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return RiErrorWarningLine;
      case 'warning':
        return RiAlarmWarningLine;
      case 'info':
        return RiInformationLine;
      case 'success':
        return RiCheckboxCircleLine;
      default:
        return RiInformationLine;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
        return 'blue';
      case 'success':
        return 'emerald';
      default:
        return 'blue';
    }
  };

  if (!alert || !isVisible) return null;

  const IconComponent = getAlertIcon(alert.type);
  const alertColor = getAlertColor(alert.type);

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-96 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-purple-200 dark:border-purple-700 shadow-lg">
        <Flex justifyContent="between" alignItems="start" className="mb-2">
          <div className="flex items-center space-x-3">
            <div className={`text-${alertColor}-500 dark:text-${alertColor}-400`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <Text className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">
                {alert.title}
              </Text>
              <Badge color={alertColor} size="xs" className="mt-1">
                {alert.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button
            variant="light"
            size="xs"
            onClick={handleDismiss}
            className="text-tremor-content-subtle hover:text-tremor-content-strong dark:text-dark-tremor-content-subtle dark:hover:text-dark-tremor-content-strong"
          >
            <RiCloseLine className="w-4 h-4" />
          </Button>
        </Flex>
        
        <Text className="text-tremor-content dark:text-dark-tremor-content text-sm leading-relaxed">
          {alert.message}
        </Text>
        
        <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
            {new Date(alert.timestamp).toLocaleString()}
          </Text>
        </div>
      </Card>
    </div>
  );
};
