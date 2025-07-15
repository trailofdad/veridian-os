import { SerialPort, ReadlineParser } from "serialport";
import fetch from "node-fetch";
import process from "node:process";

// Try different serial ports in order of preference
const POSSIBLE_PORTS = [
  "/dev/tty.usbmodem1101",  // macOS Arduino
  "/dev/ttyUSB0",           // Linux Arduino (common)
  "/dev/ttyACM0",           // Linux Arduino (alternative)
  "/dev/tty.usbserial-*",   // macOS FTDI devices
];

// Function to find the first available port
function findAvailablePort(): string {
  const fs = require('fs');
  
  for (const port of POSSIBLE_PORTS) {
    try {
      if (fs.existsSync(port)) {
        console.log(`Found serial port: ${port}`);
        return port;
      }
    } catch (error) {
      // Continue to next port
    }
  }
  
  // If no port found, default to the first one and let it fail with a helpful message
  console.log(`No serial ports found. Tried: ${POSSIBLE_PORTS.join(', ')}`);
  return POSSIBLE_PORTS[0];
}

const ARDUINO_PORT = findAvailablePort();
const BAUD_RATE = 9600; // Must match your Arduino sketch
const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data"; // Internal container communication

const port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" })); // Reads data line by line

port.on("open", () => {
  console.log("Serial port opened.");
});

parser.on("data", async (line: string) => {
  console.log("Received serial data:", line);
  try {
    const sensorData = JSON.parse(line.trim()); // Parse the JSON string
    console.log("Parsed sensor data:", sensorData);

    // Send to Express API
    const response = await fetch(EXPRESS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorData),
    });

    if (response.ok) {
      console.log("Sensor data sent to Express API successfully.");
    } else {
      console.error(
        "Failed to send sensor data to Express API:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error parsing JSON or sending data:", error);
  }
});

port.on("error", (err) => {
  console.error("Serial Port Error:", err.message);
});

// You might want to add process exit listeners here to close the port gracefully
process.on("exit", () => {
  if (port.isOpen) {
    port.close();
    console.log("Serial port closed.");
  }
});
