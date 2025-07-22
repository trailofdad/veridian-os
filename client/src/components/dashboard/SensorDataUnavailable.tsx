import { Card, Flex, Text } from "@tremor/react";

const SensorDataUnavailable = () => {
  return (
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
  );
};

export default SensorDataUnavailable;