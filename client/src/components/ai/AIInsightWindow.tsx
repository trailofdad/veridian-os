"use client";

import React from 'react';
import { Text } from '@tremor/react';
import { RiRobotLine, RiSparklingLine } from '@remixicon/react';
import { Windows95Window } from '@/components/ui';

interface AIInsightWindowProps {
  isOpen: boolean;
  onClose: () => void;
  report: string;
  isLoading?: boolean;
  error?: string | null;
}

export const AIInsightWindow: React.FC<AIInsightWindowProps> = ({
  isOpen,
  onClose,
  report,
  isLoading = false,
  error = null,
}) => {
  return (
    <Windows95Window
      isOpen={isOpen}
      onClose={onClose}
      title="VeridianAI Care Assistant - Daily Insights Report"
      titleIcon={RiRobotLine}
      isLoading={isLoading}
      loadingText="Generating AI insights..."
      loadingIcon={RiSparklingLine}
    >
      {error ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-red-500 dark:text-red-400">
            <RiSparklingLine className="w-8 h-8" />
          </div>
          <div className="text-center">
            <Text className="text-red-600 dark:text-red-400 font-mono text-sm mb-2">
              Error Generating Report
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 font-mono text-xs">
              {error}
            </Text>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Report Header */}
          <div className="border-b border-gray-300 dark:border-gray-700 pb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-violet-600 dark:text-violet-400">
                <RiRobotLine className="w-5 h-5" />
              </div>
              <Text className="font-bold text-gray-900 dark:text-gray-100">
                VeridianAI Care Assistant Report
              </Text>
            </div>
            <Text className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Generated on {new Date().toLocaleString()}
            </Text>
          </div>
          
          {/* Report Content */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-700 rounded-sm">
            <pre className="font-mono text-xs leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {report}
            </pre>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
            <Text className="text-xs text-gray-500 dark:text-gray-400 font-mono text-center">
              This report was generated using AI analysis of your plant's sensor data.
              For urgent plant care issues, consult with a horticultural expert.
            </Text>
          </div>
        </div>
      )}
    </Windows95Window>
  );
};
