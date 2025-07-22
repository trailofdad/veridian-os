import React from "react";
import { Badge, Card, Flex, Metric, ProgressBar, Text, Color } from "@tremor/react";
import { formatToADT } from "@/utils/format-date";
import { HealthStatus } from "@/lib/plant-health";

interface SensorReading {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface SensorCardProps {
  sensor: SensorReading;
  name: string;
  color: Color;
  icon: React.ElementType;
  description: string;
  healthStatus: HealthStatus;
  healthColors: {
    badge: Color;
  };
  progress: number;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  name,
  color,
  icon,
  description,
  healthStatus,
  healthColors,
  progress,
}) => (
  <Card decoration="left" decorationColor={color}>
    <Flex justifyContent="between" alignItems="start" className="mb-4">
      <div>
        <Text className="text-tremor-content dark:text-dark-tremor-content">
          {name}
        </Text>
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

    <ProgressBar value={progress} color={color} className="mt-4" />

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

export default SensorCard;
