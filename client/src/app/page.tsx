// client/app/page.tsx (or a new component like components/SensorDashboard.tsx)
'use client'; // Important for client-side functionality in Next.js App Router

import { Card, Metric, Text, Grid } from '@tremor/react';
import { useState, useEffect } from 'react';

interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Adjust this URL if your Pi has a different IP/port
        const response = await fetch('http://localhost:3001/api/latest-sensors');
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

    fetchSensorData(); // Initial fetch
    const intervalId = setInterval(fetchSensorData, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  if (loading) return <Text className="p-4">Loading sensor data...</Text>;
  if (error) return <Text className="p-4 text-red-500">Error: {error}. Make sure the server is running and accessible.</Text>;

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">VeridianOS - Plant Dashboard</h1>

      {sensorData.length === 0 ? (
        <Text>No sensor data available yet. Ensure Arduino is sending data and server is running.</Text>
      ) : (
        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
          {sensorData.map((sensor) => (
            <Card key={sensor.sensor_type} className="flex flex-col items-center justify-center p-6 text-center">
              <Text className="text-lg font-semibold capitalize">{sensor.sensor_type.replace(/_/g, ' ')}</Text>
              <Metric className="mt-2 text-5xl font-extrabold text-blue-600">
                {sensor.value.toFixed(1)}{sensor.unit}
              </Metric>
              <Text className="mt-2 text-sm text-gray-500">
                Last updated: {new Date(sensor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
            </Card>
          ))}
        </Grid>
      )}

      {/* You can add more UI elements here, like a simple text log of events, etc. */}
    </main>
  );
}