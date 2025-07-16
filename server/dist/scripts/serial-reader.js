"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = require("serialport");
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_process_1 = __importDefault(require("node:process"));
// Try different serial ports in order of preference
const POSSIBLE_PORTS = [
    "/dev/tty.usbmodem1101", // macOS Arduino
    "/dev/ttyUSB0", // Linux Arduino (common)
    "/dev/ttyACM0", // Linux Arduino (alternative)
    "/dev/tty.usbserial-*", // macOS FTDI devices
];
// Function to find the first available port
function findAvailablePort() {
    const fs = require('fs');
    for (const port of POSSIBLE_PORTS) {
        try {
            if (fs.existsSync(port)) {
                console.log(`Found serial port: ${port}`);
                return port;
            }
        }
        catch (error) {
            // Continue to next port
        }
    }
    // If no port found, return null to indicate fallback to mock
    console.log(`No serial ports found. Tried: ${POSSIBLE_PORTS.join(', ')}`);
    console.log(`Falling back to mock Arduino service...`);
    return null;
}
const ARDUINO_PORT = findAvailablePort();
const BAUD_RATE = 9600; // Must match your Arduino sketch
const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data"; // Internal container communication
// If no port found, start mock Arduino service
if (!ARDUINO_PORT) {
    console.log("🤖 Starting integrated mock Arduino service...");
    startMockArduinoService();
}
else {
    // Start serial port communication
    startSerialPortService();
}
// Mock Arduino service function
function startMockArduinoService() {
    console.log("📡 Sending mock sensor data every 3 seconds");
    // Generate mock sensor data
    function generateMockSensorData() {
        return {
            temperature: Math.round((20 + Math.random() * 15) * 10) / 10, // 20-35°C
            humidity: Math.round((30 + Math.random() * 40) * 10) / 10, // 30-70%
            soil_moisture: Math.round((20 + Math.random() * 60) * 10) / 10, // 20-80%
            illuminance: Math.round((100 + Math.random() * 900)), // 100-1000 lux
            pressure: Math.round((950 + Math.random() * 100) * 10) / 10, // 950-1050 hPa
        };
    }
    async function sendMockData() {
        try {
            const mockData = generateMockSensorData();
            console.log("Sending mock sensor data:", mockData);
            const response = await (0, node_fetch_1.default)(EXPRESS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(mockData),
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
    // Send data every 3 seconds
    const interval = setInterval(sendMockData, 3000);
    // Cleanup on exit
    node_process_1.default.on("exit", () => {
        clearInterval(interval);
        console.log("Mock Arduino service stopped.");
    });
    node_process_1.default.on("SIGINT", () => {
        clearInterval(interval);
        console.log("Mock Arduino service stopped.");
        node_process_1.default.exit(0);
    });
    node_process_1.default.on("SIGTERM", () => {
        clearInterval(interval);
        console.log("Mock Arduino service stopped.");
        node_process_1.default.exit(0);
    });
}
// Serial port service function
function startSerialPortService() {
    console.log("📡 Starting serial port communication...");
    const port = new serialport_1.SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
    const parser = port.pipe(new serialport_1.ReadlineParser({ delimiter: "\n" })); // Reads data line by line
    port.on("open", () => {
        console.log("Serial port opened.");
    });
    parser.on("data", async (line) => {
        console.log("Received serial data:", line);
        try {
            const sensorData = JSON.parse(line.trim()); // Parse the JSON string
            console.log("Parsed sensor data:", sensorData);
            // Send to Express API
            const response = await (0, node_fetch_1.default)(EXPRESS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sensorData),
            });
            if (response.ok) {
                console.log("Sensor data sent to Express API successfully.");
            }
            else {
                console.error("Failed to send sensor data to Express API:", response.status, response.statusText);
            }
        }
        catch (error) {
            console.error("Error parsing JSON or sending data:", error);
        }
    });
    port.on("error", (err) => {
        console.error("Serial Port Error:", err.message);
    });
    // Cleanup on exit
    node_process_1.default.on("exit", () => {
        if (port.isOpen) {
            port.close();
            console.log("Serial port closed.");
        }
    });
    node_process_1.default.on("SIGINT", () => {
        if (port.isOpen) {
            port.close();
            console.log("Serial port closed.");
        }
        node_process_1.default.exit(0);
    });
    node_process_1.default.on("SIGTERM", () => {
        if (port.isOpen) {
            port.close();
            console.log("Serial port closed.");
        }
        node_process_1.default.exit(0);
    });
}
