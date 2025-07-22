"use client";

import { Flex, Divider } from "@tremor/react";
import { useState, useEffect } from "react";
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
import Footer from "./Footer";

export interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

const DATA_FETCH_INTERVAL = 10000; // 10 seconds - more realistic for plant environments

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
        console.log("Sensor data fetched successfully:", data);
      } catch (err: any) {
        console.error("Error fetching sensor data:", err);
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

      <Footer />
    </Layout>
  );
};
