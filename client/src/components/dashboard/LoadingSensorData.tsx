import Layout from "@/app/layout";
import React from "react";
import { Text } from "@tremor/react";

const LoadingSensorData = () => {
  return (
    <Layout>
      <div className="flex items-center justify-center py-20">
        <Text className="text-xl text-tremor-content dark:text-dark-tremor-content">
          Loading sensor data...
        </Text>
      </div>
    </Layout>
  );
};

export default LoadingSensorData;
