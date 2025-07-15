#include <Arduino_MKRENV.h>

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

  // Format ENV data into JSON string for a single payload
  String jsonEnvData = "{ \"temperature\": " + String(temperature) +
              ", \"humidity\": " + String(humidity) +
              ", \"pressure\": " + String(pressure) +
              ", \"illuminance\": " + String(illuminance) +
              ", \"uva\": " + String(uva) +
              ", \"uvb\": " + String(uvb) +
              ", \"uvIndex\": " + String(uvIndex) + " }";
  
  // Print jsonEnvData to serial for Pi to use
  Serial.println(jsonEnvData);

  // Update the jsonEnvData every 5 seconds
  delay(updateInterval);
}