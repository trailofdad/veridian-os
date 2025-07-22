#include <Arduino_MKRENV.h>

#define sensorPin A0

void setup() {
  Serial.begin(9600);
  while (!Serial);

  if (!ENV.begin()) {
    Serial.println("Failed to initialize MKR ENV shield!");
    while (1);
  }
}

void loop() {
  // Constants
  // How often we print the jsonEnvData
  const int updateInterval = 3000;

  // Read all the sensor values
  float temperature = ENV.readTemperature();
  float humidity    = ENV.readHumidity();
  float pressure    = ENV.readPressure();
  float illuminance = ENV.readIlluminance();
  float uva         = ENV.readUVA();
  float uvb         = ENV.readUVB();
  float uvIndex     = ENV.readUVIndex();
  int soilMoisture = readSensor();

  

  // Format ENV data into JSON string for a single payload
  String jsonEnvData = "{ \"temperature\": " + String(temperature) +
              ", \"humidity\": " + String(humidity) +
              ", \"soil_moisture\": " + String(soilMoisture) +
              ", \"pressure\": " + String(pressure) +
              ", \"illuminance\": " + String(illuminance) +
              ", \"uva\": " + String(uva) +
              ", \"uvb\": " + String(uvb) +
              ", \"uv_index\": " + String(uvIndex) + " }";
  
  // Print jsonEnvData to serial for Pi to use
  Serial.println(jsonEnvData);

  // Update the jsonEnvData every 5 seconds
  delay(updateInterval);
}


//  This function returns the analog data to calling function
int readSensor() {
  int sensorValue = analogRead(sensorPin);  // Read the analog value from sensor
  int outputValue = map(sensorValue, 0, 1023, 255, 0); // map the 10-bit data to 8-bit data

  return outputValue;             // Return analog moisture value
}