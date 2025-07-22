import React from "react";
import { Text, Metric, Badge, ProgressBar } from "@tremor/react";
import { SensorReading } from ".";
import { getOverallHealth } from "@/utils/sensor-utils";

interface HealthScoreProps {
  sensorData: SensorReading[];
}

const HealthScore: React.FC<HealthScoreProps> = ({ sensorData }) => {
  const overallHealth = getOverallHealth(sensorData);
  return (
    <div className="text-center">
      <Text className="text-tremor-content dark:text-dark-tremor-content text-sm mb-1">
        Overall Plant Health
      </Text>
      <Metric className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
        {overallHealth.score.toFixed(0)}%
      </Metric>
      <Badge
        color={
          overallHealth.status === "excellent"
            ? "emerald"
            : overallHealth.status === "good"
              ? "blue"
              : overallHealth.status === "fair"
                ? "yellow"
                : "red"
        }
        size="sm"
        className="mt-2"
      >
        {overallHealth.status.charAt(0).toUpperCase() +
          overallHealth.status.slice(1)}
      </Badge>
      <div className="w-32 mt-3">
        <ProgressBar
          value={overallHealth.score}
          color={
            overallHealth.status === "excellent"
              ? "emerald"
              : overallHealth.status === "good"
                ? "blue"
                : overallHealth.status === "fair"
                  ? "yellow"
                  : "red"
          }
        />
        <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs mt-1">
          Health Score
        </Text>
      </div>
    </div>
  );
};

export default HealthScore;
