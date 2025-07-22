import { Subtitle, Title } from "@tremor/react";
import React from "react";

function DashboardTitle() {
  return (
    <div>
      <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Plant Health Dashboard
      </Title>
      <Subtitle className="text-tremor-content dark:text-dark-tremor-content">
        Real-time monitoring and insights
      </Subtitle>
    </div>
  );
}

export default DashboardTitle;
