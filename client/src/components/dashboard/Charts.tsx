import { getSensorDisplayInfo } from "@/utils/sensor-utils";
import {
  Title,
  Card,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  AreaChart,
  Text,
} from "@tremor/react";
import React, { useEffect, useState } from "react";
import { SensorReading } from ".";
import { API_ENDPOINTS, apiCall } from "@/lib/api-config";
import { TIME_PERIODS, TRENDING_SENSORS } from "@/lib/chartUtils";

interface HistoricalData {
  timestamp: string;
  value: number;
  unit: string;
}

interface ChartsProps {
  sensorData: SensorReading[];
}

const Charts: React.FC<ChartsProps> = ({ sensorData }) => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    TIME_PERIODS[0].value
  );
  const [historicalData, setHistoricalData] = useState<
    Record<string, HistoricalData[]>
  >({});

  // Fetch historical data for charts
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const selectedPeriod = TIME_PERIODS.find(
          (p) => p.value === selectedTimePeriod
        );
        const hours = selectedPeriod?.hours || 24;
        const days = hours / 24;

        const historicalPromises = TRENDING_SENSORS.map(async (sensorType) => {
          const response = await apiCall(
            API_ENDPOINTS.SENSOR_HISTORY(sensorType) + `?days=${days}`
          );
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

  // Prepare data for charts
  const prepareChartData = (sensorType: string) => {
    const data = historicalData[sensorType] || [];

    // Return empty array if no data
    if (data.length === 0) return [];

    // Get the selected time period to determine proper time formatting
    const selectedPeriod = TIME_PERIODS.find(
      (p) => p.value === selectedTimePeriod
    );
    const hours = selectedPeriod?.hours || 1;

    return data.map((item) => {
      let timeLabel;
      const date = new Date(item.timestamp);

      // Format timestamp based on time period
      if (hours <= 3) {
        // For short periods, show time only
        timeLabel = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (hours <= 24) {
        // For day periods, show hour and minute
        timeLabel = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // For longer periods, show month/day and hour
        timeLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
        });
      }

      return {
        timestamp: timeLabel,
        value: item.value,
        [sensorType]: item.value,
      };
    });
  };
  return (
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
                className={
                  selectedTimePeriod === period.value
                    ? "bg-violet-100 text-violet-700"
                    : ""
                }
              >
                {period.label}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            <TabPanel>
              <Grid
                numItems={1}
                numItemsMd={2}
                numItemsLg={3}
                className="gap-6"
              >
                {TRENDING_SENSORS.map((sensorType) => {
                  const { name, color } = getSensorDisplayInfo(sensorType);
                  const chartData = prepareChartData(sensorType);
                  const sensorReading = sensorData.find(
                    (s) => s.sensor_type === sensorType
                  );

                  return (
                    <Card
                      key={`chart-${sensorType}`}
                      className="bg-gray-50 dark:bg-gray-800 min-h-[320px]"
                    >
                      <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        {name} Trends
                      </Title>
                      {chartData.length > 0 ? (
                        <div className="mt-4 w-full h-72 min-w-0">
                          <AreaChart
                            className="w-full h-full"
                            data={chartData}
                            index="timestamp"
                            categories={[sensorType]}
                            colors={[color]}
                            valueFormatter={(value) =>
                              `${value.toFixed(1)} ${sensorReading?.unit || ""}`
                            }
                            yAxisWidth={60}
                            showXAxis={true}
                            showYAxis={true}
                            showGridLines={true}
                            autoMinValue={true}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-72 mt-4">
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
  );
};

export default Charts;
