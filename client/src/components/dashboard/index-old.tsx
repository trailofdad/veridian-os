"use client";

import { formatToADT } from "@/utils/format-date";
import { 
  Card, 
  Metric, 
  Text, 
  Grid, 
  Badge, 
  ProgressBar,
  CategoryBar,
  BarChart,
  LineChart,
  AreaChart,
  DonutChart,
  Title,
  Subtitle,
  Flex,
  Color,
  Tracker,
  Callout,
  Divider
} from "@tremor/react";
import { useState, useEffect } from "react";
import { apiCall, API_ENDPOINTS } from "@/lib/api-config";
import { getHealthStatus, getHealthColors, getStatusIcon, getStatusMessage, type SensorType, DEFAULT_PLANT_CONFIG } from "@/lib/plant-health";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { Layout } from "@/components/layout/Layout";

// TODO: Import icons 
// import { FaThermometerHalf, FaTint, FaLightbulb, FaCloud } from 'react-icons/fa';

interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

const DATA_FETCH_INTERVAL = 3000;

export const Dashboard = () => {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await apiCall(API_ENDPOINTS.LATEST_SENSORS);
        const data: SensorReading[] = await response.json();
        setSensorData(data);
      } catch (e: any) {
        setError(e.message);
        console.error("Failed to fetch sensor data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, DATA_FETCH_INTERVAL); // Fetch every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Helper to map sensor types to display names and potentially icons/colors
  const getSensorDisplayInfo = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return {
          name: "Temperature",
          // icon: <FaThermometerHalf className="text-red-500" />,
          color: "red",
        };
      case "humidity":
        return {
          name: "Humidity",
          // icon: <FaTint className="text-blue-500" />,
          color: "blue",
        };
      case "pressure":
        return {
          name: "Pressure",
          // icon: <FaCloud className="text-gray-500" />,
          color: "gray",
        };
      case "illuminance":
        return {
          name: "Illuminance",
          // icon: <FaLightbulb className="text-yellow-500" />,
          color: "yellow",
        };
      case "soil_moisture":
        return {
          name: "Soil Moisture",
          // icon: <FaTint className="text-green-500" />,
          color: "green",
        };
      case "uva":
      case "uvb":
      case "uvIndex":
        return {
          name: sensorType.toUpperCase(),
          color: "purple",
        };
      default:
        return {
          name: sensorType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalize first letter of each word
          color: "stone",
        };
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Text className="text-xl text-gray-700 dark:text-gray-300">
            Loading sensor data...
          </Text>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Text className="text-xl text-red-500 dark:text-red-400 text-center">
            Error: {error}. Make sure the server is running and accessible.
          </Text>
        </div>
      </Layout>
    );

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </Text>
            <Text className="text-gray-600 dark:text-gray-400">
              Real-time plant monitoring overview
            </Text>
          </div>
          <div className="flex items-center space-x-3">
            <Badge color="blue" size="sm">
              🌱 {DEFAULT_PLANT_CONFIG.name}
            </Badge>
            <Badge color="green" size="sm">
              📈 {DEFAULT_PLANT_CONFIG.stage.charAt(0).toUpperCase() + DEFAULT_PLANT_CONFIG.stage.slice(1)} Stage
            </Badge>
          </div>
        </div>
      </div>

      {/* Notification System */}
      <NotificationSystem />

      {/* Sensor Data Display */}
      {sensorData.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Text className="text-lg text-gray-700 dark:text-gray-300 text-center">
            No sensor data available yet. <br />
            Ensure Arduino is sending data and the API server is running.
          </Text>
        </div>
      ) : (
        <Grid
          numItems={1} // Start with 1 column on smallest screens (mobile first)
          numItemsSm={2} // 2 columns on small screens and up
          numItemsMd={3} // 3 columns on med screens and up
          numItemsLg={4} 
          className="gap-6"
        >
          {sensorData.map((sensor) => {
            const { name } = getSensorDisplayInfo(sensor.sensor_type);
            const healthStatus = getHealthStatus(sensor.sensor_type as SensorType, sensor.value);
            const healthColors = getHealthColors(healthStatus);
            const statusIcon = getStatusIcon(healthStatus);
            const statusMessage = getStatusMessage(healthStatus, sensor.sensor_type as SensorType);
            
            return (
              <Card
                key={sensor.sensor_type}
                className={`flex flex-col items-start p-6 border-l-4 border-solid ${healthColors.bg} ${healthColors.border}`}
                decoration="left"
                decorationColor={healthColors.decoration}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Text className={`text-sm font-medium uppercase tracking-wider ${healthColors.text}`}>
                    {name}
                  </Text>
                  <span className="text-lg" title={statusMessage}>
                    {statusIcon}
                  </span>
                </div>
                
                <Metric className={`mt-1 text-4xl font-extrabold ${healthColors.text}`}>
                  {sensor.value.toFixed(1)}
                  <span className="text-xl font-semibold text-gray-500 dark:text-gray-400 ml-1">
                    {sensor.unit}
                  </span>
                </Metric>
                
                <Badge className="mt-3" color={healthColors.badge} size="sm">
                  {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                </Badge>
                
                <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {statusMessage}
                </Text>
                
                <Text className="mt-3 text-xs text-gray-400">
                  Last updated: {formatToADT(sensor.timestamp)}
                </Text>
              </Card>
            );
          })}
        </Grid>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-600">
        <p>&copy; {new Date().getFullYear()} VeridianOS. All rights reserved.</p>
      </div>
    </Layout>
  );
};