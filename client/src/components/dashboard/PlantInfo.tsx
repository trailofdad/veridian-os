import { DEFAULT_PLANT_CONFIG } from "@/lib/plant-health";
import { Badge } from "@tremor/react";
import React from "react";

interface PlantInfoProps {
  // Define your props here
}

const PlantInfo: React.FC<PlantInfoProps> = () => {
  return (
    <div className="flex flex-col items-end space-y-2">
      <Badge color="blue" size="sm">
        🌱 {DEFAULT_PLANT_CONFIG.name}
      </Badge>
      <Badge color="green" size="sm">
        📈{" "}
        {DEFAULT_PLANT_CONFIG.stage.charAt(0).toUpperCase() +
          DEFAULT_PLANT_CONFIG.stage.slice(1)}{" "}
        Stage
      </Badge>
    </div>
  );
};

export default PlantInfo;
