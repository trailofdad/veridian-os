import { SerialPort, ReadlineParser } from "serialport";
import fetch from "node-fetch";
const environment = require("node:process");

enum PLATFORM_IDS {
  MACOS = "darwin",
  LINUX = ""
}
const PLATFORM = environment.platform;
const MACOS_PORT = "/dev/tty.usbmodem1101";
const LINUX_PORT = "/dev/ttyUSB0"; // check with `ls /dev/tty*`
const ARDUINO_PORT = PLATFORM === PLATFORM_IDS.MACOS ? MACOS_PORT : LINUX_PORT;
const BAUD_RATE = 9600; // Must match your Arduino sketch
const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data"; // Match your Express port

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
