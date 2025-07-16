"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data"; // Internal container communication
// Mock sensor data generator
function generateMockSensorData() {
    return {
        temperature: Math.round((20 + Math.random() * 15) * 10) / 10, // 20-35°C
        humidity: Math.round((30 + Math.random() * 40) * 10) / 10, // 30-70%
        soil_moisture: Math.round((20 + Math.random() * 60) * 10) / 10, // 20-80%
        illuminance: Math.round((100 + Math.random() * 900)), // 100-1000 lux
        pressure: Math.round((950 + Math.random() * 100) * 10) / 10, // 950-1050 hPa
    };
}
async function sendSensorData(data) {
    try {
        console.log("Sending mock sensor data:", data);
        const response = await (0, node_fetch_1.default)(EXPRESS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            console.log("Mock sensor data sent to Express API successfully.");
        }
        else {
            console.error("Failed to send mock sensor data to Express API:", response.status, response.statusText);
        }
    }
    catch (error) {
        console.error("Error sending mock sensor data:", error);
    }
}
// Start the mock Arduino service
console.log("🔧 Starting Mock Arduino Service...");
console.log("📡 Sending sensor data every 3 seconds");
// Send data every 3 seconds
const interval = setInterval(async () => {
    const mockData = generateMockSensorData();
    await sendSensorData(mockData);
}, 3000);
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
