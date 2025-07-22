import Layout from "@/app/layout";
import { Callout } from "@tremor/react";
import { error } from "console";
import React from "react";

interface ServerErrorProps {
  error: string;
}

const ServerError: React.FC<ServerErrorProps> = ({error}) => {
  return (
    <Layout>
      <div className="flex items-center justify-center py-20">
        <Callout title="Connection Error" color="red">
          {error}. Make sure the server is running and accessible.
        </Callout>
      </div>
    </Layout>
  );
};

export default ServerError;
