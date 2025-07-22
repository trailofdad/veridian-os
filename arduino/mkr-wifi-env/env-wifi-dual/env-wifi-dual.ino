#include <Arduino_MKRENV.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

// Configuration - Set your preferences here
#define USE_WIFI true        // Set to false to use serial mode
#define sensorPin A0

// WiFi credentials - Replace with your network details
const char* ssid = "Dumb Potato Basket";  // Use 2.4GHz network (without _5G)
const char* password = "internetpassword";

// Server configuration - Replace with your server details
const char* serverAddress = "192.168.50.150";  // Your server IP or hostname
const int serverPort = 3001;                   // Your server port
const char* apiEndpoint = "/api/sensor-data";  // API endpoint path

// Sensor data structure
struct SensorData {
  float temperature;
  float humidity;
  int soilMoisture;
  float pressure;
  float illuminance;
  float uva;
  float uvb;
  float uvIndex;
};

// Global objects
WiFiClient wifiClient;
HttpClient httpClient = HttpClient(wifiClient, serverAddress, serverPort);

// Connection status
bool wifiConnected = false;
unsigned long lastConnectionAttempt = 0;
const unsigned long connectionRetryInterval = 30000; // Retry every 30 seconds

void setup() {
  Serial.begin(9600);
  while (!Serial);

  // Initialize MKR ENV shield
  if (!ENV.begin()) {
    Serial.println("Failed to initialize MKR ENV shield!");
    while (1);
  }

  Serial.println("=== VeridianOS Arduino Sensor Node ===");
  
  if (USE_WIFI) {
    Serial.println("Mode: WiFi");
    setupWiFi();
  } else {
    Serial.println("Mode: Serial");
    Serial.println("Ready to send sensor data via serial...");
  }
}

void loop() {
  // Constants
  const int updateInterval = 3000; // 3 seconds between readings
  
  // Read all sensor values
  float temperature = ENV.readTemperature();
  float humidity = ENV.readHumidity();
  float pressure = ENV.readPressure();
  float illuminance = ENV.readIlluminance();
  float uva = ENV.readUVA();
  float uvb = ENV.readUVB();
  float uvIndex = ENV.readUVIndex();
  int soilMoisture = readSensor();

  // Create sensor data object
  SensorData sensorData = {
    temperature,
    humidity,
    soilMoisture,
    pressure,
    illuminance,
    uva,
    uvb,
    uvIndex
  };

  if (USE_WIFI) {
    handleWiFiMode(sensorData);
  } else {
    handleSerialMode(sensorData);
  }

  delay(updateInterval);
}

void setupWiFi() {
  Serial.print("Connecting to WiFi network: ");
  Serial.println(ssid);
  
  // Check for the WiFi module
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    Serial.println("Falling back to serial mode...");
    return;
  }

  // Check firmware version
  String fv = WiFi.firmwareVersion();
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("Please upgrade the firmware");
  }

  connectToWiFi();
}

void connectToWiFi() {
  int attempts = 0;
  const int maxAttempts = 10;
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    Serial.print("Attempt ");
    Serial.print(attempts + 1);
    Serial.print("/");
    Serial.println(maxAttempts);
    
    WiFi.begin(ssid, password);
    
    // Wait up to 10 seconds for connection
    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 10) {
      delay(1000);
      Serial.print(".");
      timeout++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true;
      Serial.println();
      Serial.println("WiFi connected successfully!");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      Serial.print("Signal strength (RSSI): ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      break;
    } else {
      Serial.println(" Failed!");
      attempts++;
      if (attempts < maxAttempts) {
        Serial.println("Retrying in 3 seconds...");
        delay(3000);
      }
    }
  }
  
  if (!wifiConnected) {
    Serial.println("Failed to connect to WiFi after maximum attempts.");
    Serial.println("Will retry periodically...");
  }
}

void handleWiFiMode(SensorData data) {
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiConnected) {
      Serial.println("WiFi connection lost!");
      wifiConnected = false;
    }
    
    // Try to reconnect periodically
    unsigned long currentTime = millis();
    if (currentTime - lastConnectionAttempt > connectionRetryInterval) {
      Serial.println("Attempting to reconnect to WiFi...");
      connectToWiFi();
      lastConnectionAttempt = currentTime;
    }
    
    // Fall back to serial output when WiFi is down
    Serial.println("WiFi unavailable - outputting to serial:");
    handleSerialMode(data);
    return;
  }
  
  // Send data via HTTP POST
  bool success = sendSensorDataHTTP(data);
  
  if (success) {
    Serial.println("✓ Data sent successfully via WiFi");
  } else {
    Serial.println("✗ Failed to send data via WiFi - outputting to serial:");
    handleSerialMode(data);
  }
}

void handleSerialMode(SensorData data) {
  // Format data as JSON for serial output (same as original script)
  String jsonData = createJSONString(data);
  Serial.println(jsonData);
}

bool sendSensorDataHTTP(SensorData data) {
  // Create JSON payload
  String jsonPayload = createJSONString(data);
  
  Serial.print("Sending to ");
  Serial.print(serverAddress);
  Serial.print(":");
  Serial.print(serverPort);
  Serial.println(apiEndpoint);
  
  // Make HTTP POST request
  httpClient.beginRequest();
  httpClient.post(apiEndpoint);
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonPayload.length());
  httpClient.sendHeader("User-Agent", "VeridianOS-Arduino/1.0");
  httpClient.beginBody();
  httpClient.print(jsonPayload);
  httpClient.endRequest();
  
  // Get response
  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();
  
  Serial.print("HTTP Status: ");
  Serial.println(statusCode);
  
  if (statusCode == 200 || statusCode == 201) {
    // Success
    if (response.length() > 0) {
      Serial.print("Response: ");
      Serial.println(response);
    }
    return true;
  } else {
    // Error
    Serial.print("Error response: ");
    Serial.println(response);
    return false;
  }
}

String createJSONString(SensorData data) {
  // Create JSON string manually (lightweight approach)
  String json = "{";
  json += "\"temperature\": " + String(data.temperature, 2) + ",";
  json += "\"humidity\": " + String(data.humidity, 2) + ",";
  json += "\"soil_moisture\": " + String(data.soilMoisture) + ",";
  json += "\"pressure\": " + String(data.pressure, 2) + ",";
  json += "\"illuminance\": " + String(data.illuminance, 2) + ",";
  json += "\"uva\": " + String(data.uva, 2) + ",";
  json += "\"uvb\": " + String(data.uvb, 2) + ",";
  json += "\"uv_index\": " + String(data.uvIndex, 2);
  json += "}";
  return json;
}

int readSensor() {
  int sensorValue = analogRead(sensorPin);  // Read the analog value from sensor
  int outputValue = map(sensorValue, 0, 1023, 255, 0); // map the 10-bit data to 8-bit data
  return outputValue;             // Return analog moisture value
}

void printWiFiStatus() {
  // Print network information
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  Serial.print("Signal strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}
