import React from "react";
import { Text } from "@tremor/react";

const Footer: React.FC = () => {
  return (
    <div className="mt-12 text-center">
      <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
        © {new Date().getFullYear()} VeridianOS. All rights reserved.
      </Text>
    </div>
  );
};

export default Footer;
