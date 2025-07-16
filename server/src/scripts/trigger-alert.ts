import fetch from "node-fetch";

const EXPRESS_API_URL = "http://localhost:3001/api/sensor-data";

// Generate extreme sensor values that will trigger alerts
async function triggerAlert() {
  const extremeData = {
    temperature: 35.5,    // Above normal range to trigger alert
    humidity: 90.0,       // Very high humidity
    soil_moisture: 20.0,  // Very low soil moisture
    illuminance: 50,      // Very low light
    pressure: 950.0,      // Very low pressure
  };

  try {
    console.log("Sending extreme sensor data to trigger alerts:", extremeData);
    
    const response = await fetch(EXPRESS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(extremeData),
    });

    if (response.ok) {
      console.log("Extreme sensor data sent successfully - should trigger alerts!");
    } else {
      console.error(
        "Failed to send extreme sensor data:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error sending extreme sensor data:", error);
  }
}

// Trigger the alert
triggerAlert();
