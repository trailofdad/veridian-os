"use client";

import React, { useState } from 'react';
import { SensorReading } from '@/components/dashboard';
import { AIInsightWindow } from './AIInsightWindow';
import { useNavigation } from '@/contexts/NavigationContext';
import { 
  generateAIInsight, 
  processSensorDataForInsight, 
  PlantData, 
  DailyInsightRequest 
} from '@/lib/ai-service';

interface AIInsightsProps {
  sensorData: SensorReading[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  sensorData,
}) => {
  const { showAIInsights, closeAIInsights } = useNavigation();
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This would ideally come from your plant management system
  // For now, we'll use placeholder data
  const plantData: PlantData = {
    name: 'My Plant',
    type: 'Houseplant',
    stage: 'Growing',
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport('');

    try {
      // Process historical sensor data for the last 24 hours
      const sensorSummary = await processSensorDataForInsight();
      
      const request: DailyInsightRequest = {
        plantData,
        sensorSummary,
        period: 'Last 24 hours',
      };

      const generatedReport = await generateAIInsight(request);
      setReport(generatedReport);
    } catch (err: any) {
      console.error('Error generating AI insight:', err);
      setError(err.message || 'Failed to generate AI insight. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate report when window opens if we don't have one
  React.useEffect(() => {
    if (showAIInsights && !report && !isLoading && !error) {
      handleGenerateReport();
    }
  }, [showAIInsights]);

  const handleClose = () => {
    closeAIInsights();
    // Optionally clear the report when closing
    // setReport('');
    // setError(null);
  };

  return (
    <AIInsightWindow
      isOpen={showAIInsights}
      onClose={handleClose}
      report={report}
      isLoading={isLoading}
      error={error}
    />
  );
};
