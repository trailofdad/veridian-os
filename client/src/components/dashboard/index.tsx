"use client";

import { formatToADT } from "@/utils/format-date";
import { 
  Card, 
  Metric, 
  Text, 
  Grid, 
  Badge, 
  ProgressBar,
  Title,
  Subtitle,
  Flex,
  Callout,
  Divider,
  AreaChart,
  List,
  ListItem,
  Color,
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel
} from "@tremor/react";
import { useState, useEffect } from "react";
import React from "react";
import { apiCall, API_ENDPOINTS } from "@/lib/api-config";
import { getHealthStatus, getHealthColors, getStatusIcon, getStatusMessage, type SensorType, DEFAULT_PLANT_CONFIG } from "@/lib/plant-health";
import { Layout } from "@/components/layout/Layout";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
// RemixIcon imports
import { 
  RiThermometerLine,
  RiDropLine,
  RiWindyLine,
  RiSunLine,
  RiPlantLine,
  RiDashboardLine
} from '@remixicon/react';

interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface HistoricalData {
  timestamp: string;
  value: number;
  unit: string;
}

const DATA_FETCH_INTERVAL = 10000; // 10 seconds - more realistic for plant environments

// Time period options for trends
const TIME_PERIODS = [
  { label: '1 Hour', value: '1h', hours: 1 },
  { label: '3 Hours', value: '3h', hours: 3 },
  { label: '6 Hours', value: '6h', hours: 6 },
  { label: '12 Hours', value: '12h', hours: 12 },
  { label: '24 Hours', value: '24h', hours: 24 },
  { label: '48 Hours', value: '48h', hours: 48 },
  { label: '1 Week', value: '1w', hours: 168 },
];

// Focus on these key sensor types for trending
const TRENDING_SENSORS = ['temperature', 'humidity', 'soil_moisture'];

export const Dashboard = () => {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIODS[0].value);

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
    const intervalId = setInterval(fetchSensorData, DATA_FETCH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch historical data for charts
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const selectedPeriod = TIME_PERIODS.find(p => p.value === selectedTimePeriod);
        const hours = selectedPeriod?.hours || 24;
        const days = hours / 24;
        
        const historicalPromises = TRENDING_SENSORS.map(async (sensorType) => {
          const response = await apiCall(API_ENDPOINTS.SENSOR_HISTORY(sensorType) + `?days=${days}`);
          const data = await response.json();
          return { sensorType, data };
        });

        const results = await Promise.all(historicalPromises);
        const historical: Record<string, HistoricalData[]> = {};
        
        results.forEach(({ sensorType, data }) => {
          historical[sensorType] = data;
        });

        setHistoricalData(historical);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
      }
    };

    fetchHistoricalData();
  }, [selectedTimePeriod]);

  // Helper to get sensor display info with Tremor colors and RemixIcon icons
  const getSensorDisplayInfo = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return {
          name: "Temperature",
          color: "red" as Color,
          icon: RiThermometerLine,
          description: "Ambient temperature"
        };
      case "humidity":
        return {
          name: "Humidity",
          color: "blue" as Color,
          icon: RiDropLine,
          description: "Air humidity level"
        };
      case "pressure":
        return {
          name: "Pressure",
          color: "violet" as Color,
          icon: RiWindyLine,
          description: "Atmospheric pressure"
        };
      case "illuminance":
        return {
          name: "Light",
          color: "yellow" as Color,
          icon: RiSunLine,
          description: "Light intensity"
        };
      case "soil_moisture":
        return {
          name: "Soil Moisture",
          color: "green" as Color,
          icon: RiPlantLine,
          description: "Soil water content"
        };
      default:
        return {
          name: sensorType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
          color: "purple" as Color,
          icon: RiDashboardLine,
          description: "Sensor reading"
        };
    }
  };

  // Calculate health progress for progress bars
  const getHealthProgress = (sensorType: string, value: number) => {
    const config = DEFAULT_PLANT_CONFIG.ranges[sensorType as SensorType];
    if (!config?.ideal) return 50;

    const { min, max } = config.ideal;
    const range = max - min;
    const position = Math.max(0, Math.min(100, ((value - min) / range) * 100));
    return position;
  };

  // Calculate overall plant health
  const getOverallHealth = () => {
    if (sensorData.length === 0) return { score: 0, status: "unknown" };
    
    const healthScores = sensorData.map(sensor => {
      const status = getHealthStatus(sensor.sensor_type as SensorType, sensor.value);
      return status === "ideal" ? 100 : status === "ok" ? 60 : 20;
    });

    const avgScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
    const status = avgScore >= 80 ? "excellent" : avgScore >= 60 ? "good" : avgScore >= 40 ? "fair" : "poor";
    
    return { score: avgScore, status };
  };

  // Prepare data for charts
  const prepareChartData = (sensorType: string) => {
    const data = historicalData[sensorType] || [];
    return data.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      value: item.value,
      [sensorType]: item.value
    }));
  };


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Text className="text-xl text-tremor-content dark:text-dark-tremor-content">
            Loading sensor data...
          </Text>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Callout title="Connection Error" color="red">
            {error}. Make sure the server is running and accessible.
          </Callout>
        </div>
      </Layout>
    );
  }

  const overallHealth = getOverallHealth();

  return (
    <Layout>
      {/* Page Header with Health Overview */}
      <div className="mb-8">
        <Flex justifyContent="between" alignItems="start" className="mb-6">
          {/* Title Section */}
          <div>
            <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Plant Health Dashboard
            </Title>
            <Subtitle className="text-tremor-content dark:text-dark-tremor-content">
              Real-time monitoring and insights
            </Subtitle>
          </div>

          {/* Overall Health Status - Vertical Stack */}
          <div className="text-center">
            <Text className="text-tremor-content dark:text-dark-tremor-content text-sm mb-1">
              Overall Plant Health
            </Text>
            <Metric className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              {overallHealth.score.toFixed(0)}%
            </Metric>
            <Badge 
              color={overallHealth.status === "excellent" ? "emerald" : 
                     overallHealth.status === "good" ? "blue" : 
                     overallHealth.status === "fair" ? "yellow" : "red"}
              size="sm"
              className="mt-2"
            >
              {overallHealth.status.charAt(0).toUpperCase() + overallHealth.status.slice(1)}
            </Badge>
            <div className="w-32 mt-3">
              <ProgressBar 
                value={overallHealth.score} 
                color={overallHealth.status === "excellent" ? "emerald" : 
                       overallHealth.status === "good" ? "blue" : 
                       overallHealth.status === "fair" ? "yellow" : "red"}
              />
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs mt-1">
                Health Score
              </Text>
            </div>
          </div>

          {/* Plant Info Badges */}
          <div className="flex flex-col items-end space-y-2">
            <Badge color="blue" size="sm">
              🌱 {DEFAULT_PLANT_CONFIG.name}
            </Badge>
            <Badge color="green" size="sm">
              📈 {DEFAULT_PLANT_CONFIG.stage.charAt(0).toUpperCase() + DEFAULT_PLANT_CONFIG.stage.slice(1)} Stage
            </Badge>
          </div>
        </Flex>
      </div>

      <Divider />

      {/* Notification System */}
      <NotificationSystem />

      {/* Main Dashboard Content */}
      {sensorData.length === 0 ? (
        <Card className="p-8">
          <Flex justifyContent="center" alignItems="center" className="py-12">
            <div className="text-center">
              <Text className="text-lg text-tremor-content dark:text-dark-tremor-content">
                No sensor data available yet.
              </Text>
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-2">
                Ensure Arduino is sending data and the API server is running.
              </Text>
            </div>
          </Flex>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Sensor Metrics Grid */}
          <div>
            <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
              Current Readings
            </Title>
            <Grid numItems={1} numItemsSm={2} numItemsMd={3} numItemsLg={4} className="gap-6">
              {sensorData.map((sensor) => {
                const { name, color, icon, description } = getSensorDisplayInfo(sensor.sensor_type);
                const healthStatus = getHealthStatus(sensor.sensor_type as SensorType, sensor.value);
                const healthColors = getHealthColors(healthStatus);
                const statusIcon = getStatusIcon(healthStatus);
                const statusMessage = getStatusMessage(healthStatus, sensor.sensor_type as SensorType);
                const progress = getHealthProgress(sensor.sensor_type, sensor.value);
                
                return (
                  <Card key={sensor.sensor_type} decoration="left" decorationColor={color}>
                    <Flex justifyContent="between" alignItems="start" className="mb-4">
                      <div>
                        <Text className="text-tremor-content dark:text-dark-tremor-content">{name}</Text>
                        <Metric className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          {sensor.value.toFixed(1)}
                          <span className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-tremor-default ml-1">
                            {sensor.unit}
                          </span>
                        </Metric>
                      </div>
                      <div className="text-violet-500 dark:text-violet-400">
                        {React.createElement(icon, { className: "w-6 h-6" })}
                      </div>
                    </Flex>
                    
                    <ProgressBar 
                      value={progress} 
                      color={color}
                      className="mt-4"
                    />
                    
                    <div className="mt-4 space-y-2">
                      <Badge color={healthColors.badge} size="sm">
                        {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                      </Badge>
                      <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
                        {formatToADT(sensor.timestamp)}
                      </Text>
                    </div>
                    
                    <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs mt-2">
                      {description}
                    </Text>
                  </Card>
                );
              })}
            </Grid>
          </div>

          {/* Charts Section */}
          <div>
            <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
              Trends & Analytics
            </Title>
            <Card>
              <TabGroup>
                <TabList className="mb-4">
                  {TIME_PERIODS.map((period) => (
                    <Tab 
                      key={period.value} 
                      onClick={() => setSelectedTimePeriod(period.value)}
                      className={selectedTimePeriod === period.value ? 'bg-violet-100 text-violet-700' : ''}
                    >
                      {period.label}
                    </Tab>
                  ))}
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-6">
                      {TRENDING_SENSORS.map((sensorType) => {
                        const { name, color } = getSensorDisplayInfo(sensorType);
                        const chartData = prepareChartData(sensorType);
                        const sensorReading = sensorData.find(s => s.sensor_type === sensorType);
                        
                        return (
                          <Card key={`chart-${sensorType}`} className="bg-gray-50 dark:bg-gray-800">
                            <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                              {name} Trends
                            </Title>
                            {chartData.length > 0 ? (
                              <AreaChart
                                className="mt-4 h-72"
                                data={chartData}
                                index="timestamp"
                                categories={[sensorType]}
                                colors={[color]}
                                valueFormatter={(value) => `${value.toFixed(1)} ${sensorReading?.unit || ''}`}
                                yAxisWidth={60}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-72">
                                <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                                  No data available for this time period
                                </Text>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </Grid>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </Card>
          </div>

          {/* Plant Health Summary */}
          <Card>
            <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
              Health Summary
            </Title>
            <List>
              {sensorData.map((sensor) => {
                const { name, icon } = getSensorDisplayInfo(sensor.sensor_type);
                const healthStatus = getHealthStatus(sensor.sensor_type as SensorType, sensor.value);
                const statusMessage = getStatusMessage(healthStatus, sensor.sensor_type as SensorType);
                const statusColor = healthStatus === "ideal" ? "emerald" : 
                                  healthStatus === "ok" ? "yellow" : "red";
                
                return (
                  <ListItem key={sensor.sensor_type}>
                    <Flex justifyContent="between" alignItems="center">
                      <div className="flex items-center space-x-3">
                        <div className="text-violet-500 dark:text-violet-400">
                          {React.createElement(icon, { className: "w-5 h-5" })}
                        </div>
                        <div>
                          <Text className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                            {name}
                          </Text>
                          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
                            {statusMessage}
                          </Text>
                        </div>
                      </div>
                      <div className="text-right">
                        <Text className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                          {sensor.value.toFixed(1)} {sensor.unit}
                        </Text>
                        <Badge color={statusColor} size="xs">
                          {healthStatus}
                        </Badge>
                      </div>
                    </Flex>
                  </ListItem>
                );
              })}
            </List>
          </Card>
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
