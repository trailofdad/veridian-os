"use client";

import { formatToADT } from "@/utils/format-date";
import { Card, Metric, Text, Grid, Title, Badge } from "@tremor/react";
import { useState, useEffect } from "react";

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
        const response = await fetch(
          "http://localhost:3001/api/latest-sensors"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Text className="text-xl text-gray-700 dark:text-gray-300">
          Loading sensor data...
        </Text>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Text className="text-xl text-red-500 dark:text-red-400 text-center">
          Error: {error}. Make sure the server is running and accessible.
        </Text>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left">
        <Title className="text-4xl md:text-5xl font-extrabold text-blue-800 dark:text-blue-400 tracking-tight">
          VeridianOS
        </Title>
        <Text className="mt-2 text-lg md:text-xl text-gray-600 dark:text-gray-400">
          Real-time Plant Monitoring Dashboard
        </Text>
      </div>

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
            const { name, color /* icon */ } = getSensorDisplayInfo(
              sensor.sensor_type
            );
            return (
              <Card
                key={sensor.sensor_type}
                className="flex flex-col items-start p-6 border-l-4 border-solid" // Start from left
                decoration="left" // Adds a left border line based on 'decorationColor'
                decorationColor={color} // Use the color from helper for decoration
              >
                {/* Optional Icon
                <div className="text-3xl mb-3">
                  {icon}
                </div>
                */}
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {name}
                </Text>
                <Metric className="mt-1 text-4xl font-extrabold text-blue-700 dark:text-blue-300">
                  {sensor.value.toFixed(1)}
                  <span className="text-xl font-semibold text-gray-500 dark:text-gray-400 ml-1">
                    {sensor.unit}
                  </span>
                </Metric>
                <Text className="mt-3 text-xs text-gray-400">
                  Last updated: {formatToADT(sensor.timestamp)}
                </Text>
                {/* Badge for status or extra info */}
                {/* {sensor.sensor_type === 'soil_moisture' && sensor.value < 30 && (
                  <Badge className="mt-2" color="red">Needs Water</Badge>
                )} */}
              </Card>
            );
          })}
        </Grid>
      )}

      {/* Optional: Footer or additional info */}
      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-600">
        <p>&copy; {new Date().getFullYear()} VeridianOS. All rights reserved.</p>
      </div>
    </main>
  );
};