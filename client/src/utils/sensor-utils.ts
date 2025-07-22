import { SensorReading } from "@/components/dashboard";
import { API_ENDPOINTS, apiCall } from "@/lib/api-config";
import { getHealthStatus, SensorType } from "@/lib/plant-health";
import {
  RiThermometerLine,
  RiDropLine,
  RiWindyLine,
  RiSunLine,
  RiPlantLine,
  RiDashboardLine,
} from "@remixicon/react";
import { Color } from "@tremor/react";

export const getSensorDisplayInfo = (sensorType: string) => {
  switch (sensorType) {
    case "temperature":
      return {
        name: "Temperature",
        color: "red" as Color,
        icon: RiThermometerLine,
        description: "Ambient temperature",
      };
    case "humidity":
      return {
        name: "Humidity",
        color: "blue" as Color,
        icon: RiDropLine,
        description: "Air humidity level",
      };
    case "pressure":
      return {
        name: "Pressure",
        color: "violet" as Color,
        icon: RiWindyLine,
        description: "Atmospheric pressure",
      };
    case "illuminance":
      return {
        name: "Light",
        color: "yellow" as Color,
        icon: RiSunLine,
        description: "Light intensity",
      };
    case "soil_moisture":
      return {
        name: "Soil Moisture",
        color: "green" as Color,
        icon: RiPlantLine,
        description: "Soil water content",
      };
    default:
      return {
        name: sensorType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        color: "purple" as Color,
        icon: RiDashboardLine,
        description: "Sensor reading",
      };
  }
};

export const getOverallHealth = (sensorData: SensorReading[]) => {
  if (sensorData.length === 0) return { score: 0, status: "unknown" };

  const healthScores = sensorData.map((sensor) => {
    const status = getHealthStatus(
      sensor.sensor_type as SensorType,
      sensor.value
    );
    return status === "ideal" ? 100 : status === "ok" ? 60 : 20;
  });

  const avgScore =
    healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
  const status =
    avgScore >= 80
      ? "excellent"
      : avgScore >= 60
        ? "good"
        : avgScore >= 40
          ? "fair"
          : "poor";

  return { score: avgScore, status };
};

export const fetchSensorData = async (): Promise<SensorReading[]> => {
  const response = await apiCall(API_ENDPOINTS.LATEST_SENSORS);
  const data: SensorReading[] = await response.json();
  return data;
};
