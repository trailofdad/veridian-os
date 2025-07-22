"use client";

import { Text, Flex, Callout, Divider } from "@tremor/react";
import { useState, useEffect } from "react";
import { apiCall, API_ENDPOINTS } from "@/lib/api-config";
import { Layout } from "@/components/layout/Layout";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import SensorDataUnavailable from "./SensorDataUnavailable";
import DashboardTitle from "./Title";
import HealthScore from "./HealthScore";
import PlantInfo from "./PlantInfo";
import SensorMetricsGrid from "./SensorMetricsGrid";
import Charts from "./Charts";
import HealthSummary from "./HealthSummary";
import LoadingSensorData from "./LoadingSensorData";
import ServerError from "./ServerError";
import { fetchSensorData } from "@/utils/sensor-utils";

export interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

const DATA_FETCH_INTERVAL = 10000; // 10 seconds - more realistic for plant environments

// Time period options for trends
export const TIME_PERIODS = [
  { label: "1 Hour", value: "1h", hours: 1 },
  { label: "3 Hours", value: "3h", hours: 3 },
  { label: "6 Hours", value: "6h", hours: 6 },
  { label: "12 Hours", value: "12h", hours: 12 },
  { label: "24 Hours", value: "24h", hours: 24 },
  { label: "48 Hours", value: "48h", hours: 48 },
  { label: "1 Week", value: "1w", hours: 168 },
];

// Focus on these key sensor types for trending
export const TRENDING_SENSORS = ["temperature", "humidity", "soil_moisture"];

export const Dashboard = () => {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchAndUpdateSensorData = async () => {
      try {
        const data = await fetchSensorData();
        setSensorData(data);
        setError(null);
        console.log('Sensor data fetched successfully:', data);
      } catch (err: any) {
        console.error('Error fetching sensor data:', err);
        setError(err?.message || "Failed to fetch sensor data.");
      }
    };

    const initializePolling = async () => {
      setLoading(true);
      
      // Initial fetch
      await fetchAndUpdateSensorData();
      
      setLoading(false);
      
      // Set up polling interval
      intervalId = setInterval(fetchAndUpdateSensorData, DATA_FETCH_INTERVAL);
    };

    initializePolling();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (loading) {
    return <LoadingSensorData />;
  }

  if (error) {
    return <ServerError error={error} />;
  }

  return (
    <Layout>
      <NotificationSystem />

      {/* Page Header with Health Overview */}
      <div className="mb-8">
        <Flex justifyContent="between" alignItems="start" className="mb-6">
          <DashboardTitle />
          <HealthScore sensorData={sensorData} />
          <PlantInfo />
        </Flex>
      </div>

      <Divider />

      {sensorData.length === 0 ? (
        <SensorDataUnavailable />
      ) : (
        <div className="space-y-8">
          <SensorMetricsGrid sensorData={sensorData} />

          <Charts sensorData={sensorData} />

          <HealthSummary sensorData={sensorData} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
          © {new Date().getFullYear()} VeridianOS. All rights reserved.
        </Text>
      </div>
    </Layout>
  );
};
