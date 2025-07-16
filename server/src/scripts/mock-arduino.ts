import fetch from "node-fetch";

const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data"; // Internal container communication

// State to track previous values for gradual changes
let previousValues = {
  temperature: 22.5,    // Start at ideal temperature
  humidity: 65.0,       // Start at good humidity
  soil_moisture: 72.0,  // Start at good soil moisture
  illuminance: 450,     // Start at moderate light
  pressure: 1013.25,    // Start at standard atmospheric pressure
};

// Realistic ranges and change rates for plant environments
const SENSOR_CONFIGS = {
  temperature: {
    min: 18.0,
    max: 32.0,
    maxChange: 0.3,     // Max change per 5 seconds (gradual)
    idealRange: [20, 26],
    unit: '°C'
  },
  humidity: {
    min: 35.0,
    max: 85.0,
    maxChange: 1.0,     // Max change per 5 seconds
    idealRange: [55, 75],
    unit: '%'
  },
  soil_moisture: {
    min: 25.0,
    max: 90.0,
    maxChange: 0.8,     // Max change per 5 seconds
    idealRange: [65, 80],
    unit: '%'
  },
  illuminance: {
    min: 50,
    max: 1200,
    maxChange: 25,      // Max change per 5 seconds
    idealRange: [300, 800],
    unit: 'lux'
  },
  pressure: {
    min: 995.0,
    max: 1035.0,
    maxChange: 0.5,     // Max change per 5 seconds
    idealRange: [1005, 1025],
    unit: 'hPa'
  }
};

// Generate gradual, realistic sensor changes
function generateRealisticSensorData() {
  const newValues: any = {};
  
  Object.entries(SENSOR_CONFIGS).forEach(([sensor, config]) => {
    const currentValue = previousValues[sensor as keyof typeof previousValues];
    
    // Generate a small random change
    const changeDirection = Math.random() - 0.5; // -0.5 to 0.5
    const changeAmount = changeDirection * config.maxChange * (0.3 + Math.random() * 0.7);
    
    // Apply the change
    let newValue = currentValue + changeAmount;
    
    // Keep within realistic bounds
    newValue = Math.max(config.min, Math.min(config.max, newValue));
    
    // Occasionally drift towards ideal range (simulating environmental controls)
    if (Math.random() < 0.1) { // 10% chance
      const idealMid = (config.idealRange[0] + config.idealRange[1]) / 2;
      const drift = (idealMid - newValue) * 0.1;
      newValue += drift;
    }
    
    // Round to appropriate precision
    if (sensor === 'illuminance') {
      newValue = Math.round(newValue);
    } else {
      newValue = Math.round(newValue * 10) / 10;
    }
    
    newValues[sensor] = newValue;
    previousValues[sensor as keyof typeof previousValues] = newValue;
  });
  
  return newValues;
}

async function sendSensorData(data: any) {
  try {
    console.log("Sending mock sensor data:", data);
    
    const response = await fetch(EXPRESS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("Mock sensor data sent to Express API successfully.");
    } else {
      console.error(
        "Failed to send mock sensor data to Express API:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error sending mock sensor data:", error);
  }
}

// Start the mock Arduino service
console.log("🔧 Starting Mock Arduino Service...");
console.log("📡 Sending realistic sensor data every 5 seconds");
console.log("🌱 Simulating gradual environmental changes");

// Send initial data
const initialData = generateRealisticSensorData();
setTimeout(() => sendSensorData(initialData), 1000);

// Send data every 5 seconds
const interval = setInterval(async () => {
  const mockData = generateRealisticSensorData();
  await sendSensorData(mockData);
}, 5000);

// Graceful shutdown
process.on("exit", () => {
  clearInterval(interval);
  console.log("Mock Arduino service stopped.");
});

process.on("SIGINT", () => {
  clearInterval(interval);
  console.log("Mock Arduino service stopped.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  clearInterval(interval);
  console.log("Mock Arduino service stopped.");
  process.exit(0);
});
