import { getHealthStatus, SensorType, getStatusMessage } from "@/lib/plant-health";
import { getSensorDisplayInfo } from "@/utils/sensor-utils";
import { Card, Title, List, ListItem, Flex, Badge, Text } from "@tremor/react";
import React from "react";
import { SensorReading } from ".";

interface HealthSummaryProps {
  sensorData: SensorReading[];
}

const HealthSummary: React.FC<HealthSummaryProps> = ({ sensorData }) => {
  return (
    <Card>
      <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
        Health Summary
      </Title>
      <List>
        {sensorData.map((sensor) => {
          const { name, icon } = getSensorDisplayInfo(sensor.sensor_type);
          const healthStatus = getHealthStatus(
            sensor.sensor_type as SensorType,
            sensor.value
          );
          const statusMessage = getStatusMessage(
            healthStatus,
            sensor.sensor_type as SensorType
          );
          const statusColor =
            healthStatus === "ideal"
              ? "emerald"
              : healthStatus === "ok"
                ? "yellow"
                : "red";

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
  );
};

export default HealthSummary;
