import { GoogleGenerativeAI } from '@google/generative-ai';
import { SensorReading } from '@/components/dashboard';
import { apiCall, API_ENDPOINTS } from '@/lib/api-config';

// Initialize the AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface PlantData {
  name: string;
  type: string;
  stage?: string;
}

export interface SensorSummary {
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  avgSoilMoisture: number;
  minSoilMoisture: number;
  maxSoilMoisture: number;
  avgLight: number;
  alerts: string[];
}

export interface DailyInsightRequest {
  plantData: PlantData;
  sensorSummary: SensorSummary;
  period: string;
}

export const generateDailyInsightPrompt = (request: DailyInsightRequest): string => {
  return `You are an expert plant care assistant for VeridianOS. Provide a concise summary of the plant's health and environmental conditions for the ${request.period}.

Plant Name: ${request.plantData.name}
Plant Type: ${request.plantData.type}
${request.plantData.stage ? `Growth Stage: ${request.plantData.stage}` : ''}
Time Period: ${request.period}

Environmental Data:
- Average Temperature: ${request.sensorSummary.avgTemperature.toFixed(1)}°C (Range: ${request.sensorSummary.minTemperature.toFixed(1)} - ${request.sensorSummary.maxTemperature.toFixed(1)}°C)
- Average Humidity: ${request.sensorSummary.avgHumidity.toFixed(1)}% (Range: ${request.sensorSummary.minHumidity.toFixed(1)} - ${request.sensorSummary.maxHumidity.toFixed(1)}%)
- Average Soil Moisture: ${request.sensorSummary.avgSoilMoisture.toFixed(1)}% (Range: ${request.sensorSummary.minSoilMoisture.toFixed(1)} - ${request.sensorSummary.maxSoilMoisture.toFixed(1)}%)
- Average Light: ${request.sensorSummary.avgLight.toFixed(0)} Lux

Events:
${request.sensorSummary.alerts.length > 0 
  ? `- Alerts Triggered: ${request.sensorSummary.alerts.join(', ')}`
  : '- No alerts triggered during this period'
}
- Visual Observations: No visual abnormalities detected.

Please provide a professional report that includes:
1. **Overall Health Assessment**: Brief overview of plant condition
2. **Environmental Analysis**: Key insights about temperature, humidity, soil moisture, and light levels
3. **Notable Events**: Any significant changes or alerts
4. **Recommendations**: 1-2 specific actionable suggestions for optimal plant care

Format the response as a structured report suitable for display in a monitoring dashboard. Keep it informative but concise (under 200 words total).`;
};

export const generateAIInsight = async (request: DailyInsightRequest): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generateDailyInsightPrompt(request);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error generating AI insight:', error);
    throw new Error('Failed to generate AI insight. Please try again later.');
  }
};

interface HistoricalSensorData {
  timestamp: string;
  value: number;
  unit: string;
}

export const fetchHistoricalSensorData = async (sensorType: string, days: number = 1): Promise<HistoricalSensorData[]> => {
  try {
    const response = await apiCall(API_ENDPOINTS.SENSOR_HISTORY(sensorType) + `?days=${days}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${sensorType}:`, error);
    return [];
  }
};

export const processSensorDataForInsight = async (currentSensorData: SensorReadingCurrent[] = []): Promise<SensorSummary> => {
  const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'illuminance'];
  const historicalData: Record<string, HistoricalSensorData[]> = {};
  
  // Fetch historical data for the last 24 hours for each sensor type
  try {
    await Promise.all(
      sensorTypes.map(async (sensorType) => {
        historicalData[sensorType] = await fetchHistoricalSensorData(sensorType, 1);
      })
    );
  } catch (error) {
    console.error('Error fetching historical sensor data:', error);
  }

  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  // Process historical data
  const tempData = historicalData.temperature || [];
  const humidityData = historicalData.humidity || [];
  const soilMoistureData = historicalData.soil_moisture || [];
  const lightData = historicalData.illuminance || [];

  const tempStats = calculateStats(tempData.map(d => d.value));
  const humidityStats = calculateStats(humidityData.map(d => d.value));
  const soilMoistureStats = calculateStats(soilMoistureData.map(d => d.value));
  const lightStats = calculateStats(lightData.map(d => d.value));

  // Generate alerts based on current conditions and trends
  const alerts: string[] = [];
  
  // Temperature alerts
  if (tempStats.avg > 30) alerts.push('High temperature detected (avg: ' + tempStats.avg.toFixed(1) + '°C)');
  if (tempStats.avg < 10) alerts.push('Low temperature detected (avg: ' + tempStats.avg.toFixed(1) + '°C)');
  if (tempStats.max - tempStats.min > 15) alerts.push('High temperature variability detected');
  
  // Humidity alerts
  if (humidityStats.avg < 30) alerts.push('Low humidity levels (avg: ' + humidityStats.avg.toFixed(1) + '%)');
  if (humidityStats.avg > 85) alerts.push('High humidity levels (avg: ' + humidityStats.avg.toFixed(1) + '%)');
  
  // Soil moisture alerts
  if (soilMoistureStats.avg < 20) alerts.push('Low soil moisture (avg: ' + soilMoistureStats.avg.toFixed(1) + '%)');
  if (soilMoistureStats.avg > 90) alerts.push('Soil moisture very high - check drainage');
  
  // Light alerts
  if (lightStats.avg < 100) alerts.push('Very low light levels detected');

  return {
    avgTemperature: tempStats.avg,
    minTemperature: tempStats.min,
    maxTemperature: tempStats.max,
    avgHumidity: humidityStats.avg,
    minHumidity: humidityStats.min,
    maxHumidity: humidityStats.max,
    avgSoilMoisture: soilMoistureStats.avg,
    minSoilMoisture: soilMoistureStats.min,
    maxSoilMoisture: soilMoistureStats.max,
    avgLight: lightStats.avg,
    alerts,
  };
};

// For backward compatibility with current sensor data
interface SensorReadingCurrent {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

export const processSensorDataForInsightLegacy = (sensorData: SensorReading[]): SensorSummary => {
  if (sensorData.length === 0) {
    return {
      avgTemperature: 0,
      minTemperature: 0,
      maxTemperature: 0,
      avgHumidity: 0,
      minHumidity: 0,
      maxHumidity: 0,
      avgSoilMoisture: 0,
      minSoilMoisture: 0,
      maxSoilMoisture: 0,
      avgLight: 0,
      alerts: [],
    };
  }

  // Group sensor data by type
  const groupedData = sensorData.reduce((acc, reading) => {
    if (!acc[reading.sensor_type]) {
      acc[reading.sensor_type] = [];
    }
    acc[reading.sensor_type].push(reading.value);
    return acc;
  }, {} as Record<string, number[]>);

  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const tempStats = calculateStats(groupedData.temperature || []);
  const humidityStats = calculateStats(groupedData.humidity || []);
  const soilMoistureStats = calculateStats(groupedData.soil_moisture || []);
  const lightStats = calculateStats(groupedData.illuminance || []);

  // Basic alerts for fallback
  const alerts: string[] = [];
  if (tempStats.avg > 30) alerts.push('High temperature detected');
  if (tempStats.avg < 10) alerts.push('Low temperature detected');
  if (humidityStats.avg < 30) alerts.push('Low humidity levels');
  if (soilMoistureStats.avg < 20) alerts.push('Low soil moisture');

  return {
    avgTemperature: tempStats.avg,
    minTemperature: tempStats.min,
    maxTemperature: tempStats.max,
    avgHumidity: humidityStats.avg,
    minHumidity: humidityStats.min,
    maxHumidity: humidityStats.max,
    avgSoilMoisture: soilMoistureStats.avg,
    minSoilMoisture: soilMoistureStats.min,
    maxSoilMoisture: soilMoistureStats.max,
    avgLight: lightStats.avg,
    alerts,
  };
};
