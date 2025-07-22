import {
  getHealthStatus,
  SensorType,
  getHealthColors,
  getStatusIcon,
  getStatusMessage,
  DEFAULT_PLANT_CONFIG,
} from "@/lib/plant-health";
import { Title, Grid } from "@tremor/react";
import React from "react";
import SensorCard from "./SensorCard";
import { SensorReading } from ".";
import { getSensorDisplayInfo } from "../../utils/sensor-utils";

interface SensorData {

}

interface SensorMetricsGridProps {
  sensorData: SensorReading[];
}

const SensorMetricsGrid: React.FC<SensorMetricsGridProps> = ({ sensorData }) => {
  // Helper to get sensor display info with Tremor colors and RemixIcon icons
    

  // Calculate health progress for progress bars
  const getHealthProgress = (sensorType: string, value: number) => {
    const config = DEFAULT_PLANT_CONFIG.ranges[sensorType as SensorType];
    if (!config?.ideal) return 50;

    const { min, max } = config.ideal;
    const range = max - min;
    const position = Math.max(0, Math.min(100, ((value - min) / range) * 100));
    return position;
  };

  return (
    <div>
      <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
        Current Readings
      </Title>
      <Grid
        numItems={1}
        numItemsSm={2}
        numItemsMd={3}
        numItemsLg={4}
        className="gap-6"
      >
        {sensorData?.map((sensor) => {
          const { name, color, icon, description } = getSensorDisplayInfo(
            sensor.sensor_type
          );
          const healthStatus = getHealthStatus(
            sensor.sensor_type as SensorType,
            sensor.value
          );
          const healthColors = getHealthColors(healthStatus);
          const statusIcon = getStatusIcon(healthStatus);
          const statusMessage = getStatusMessage(
            healthStatus,
            sensor.sensor_type as SensorType
          );
          const progress = getHealthProgress(sensor.sensor_type, sensor.value);

          return (
            <SensorCard
              key={sensor.sensor_type}
              sensor={sensor}
              name={name}
              color={color}
              icon={icon}
              description={description}
              healthStatus={healthStatus}
              healthColors={healthColors}
              progress={progress}
            />
          );
        })}
      </Grid>
    </div>
  );
};

export default SensorMetricsGrid;
