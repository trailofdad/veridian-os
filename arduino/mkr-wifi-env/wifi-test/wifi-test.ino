#include <WiFiNINA.h>

// WiFi credentials
const char* ssid = "Dumb Potato Basket";  // Try 2.4GHz first
const char* password = "internetpassword";

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("=== WiFi Connection Test ===");
  
  // Check for the WiFi module
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("ERROR: Communication with WiFi module failed!");
    Serial.println("Check connections and try again.");
    while (true);
  }

  // Print firmware version
  String fv = WiFi.firmwareVersion();
  Serial.print("Firmware version: ");
  Serial.println(fv);
  
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("WARNING: Please upgrade the firmware");
  }

  // Scan for networks first
  Serial.println("\n--- Scanning for networks ---");
  scanNetworks();
  
  // Try to connect
  Serial.println("\n--- Attempting to connect ---");
  connectToWiFi();
}

void loop() {
  // Check connection status every 10 seconds
  delay(10000);
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Still connected!");
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("Connection lost! Attempting to reconnect...");
    connectToWiFi();
  }
}

void scanNetworks() {
  int numSsid = WiFi.scanNetworks();
  if (numSsid == -1) {
    Serial.println("Couldn't get a WiFi connection");
    return;
  }

  Serial.print("Number of available networks: ");
  Serial.println(numSsid);

  bool foundNetwork = false;
  for (int thisNet = 0; thisNet < numSsid; thisNet++) {
    Serial.print(thisNet);
    Serial.print(") ");
    Serial.print(WiFi.SSID(thisNet));
    Serial.print("\tSignal: ");
    Serial.print(WiFi.RSSI(thisNet));
    Serial.print(" dBm");
    Serial.print("\tEncryption: ");
    printEncryptionType(WiFi.encryptionType(thisNet));
    
    // Check if this is our target network
    if (String(WiFi.SSID(thisNet)) == String(ssid)) {
      Serial.print(" <- TARGET NETWORK FOUND!");
      foundNetwork = true;
    }
    Serial.println();
  }
  
  if (!foundNetwork) {
    Serial.println("\nWARNING: Target network not found in scan!");
    Serial.print("Looking for: '");
    Serial.print(ssid);
    Serial.println("'");
    
    // Try some common variations
    Serial.println("Try these alternatives if available:");
    Serial.println("- Dumb Potato Basket_5G");
    Serial.println("- Dumb Potato Basket_2.4G");
    Serial.println("- DumbPotatoBasket (no spaces)");
  }
}

void connectToWiFi() {
  int attempts = 0;
  const int maxAttempts = 5;
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    Serial.print("Attempt ");
    Serial.print(attempts + 1);
    Serial.print("/");
    Serial.print(maxAttempts);
    Serial.print(" - Connecting to: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid, password);
    
    // Wait up to 15 seconds for connection
    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 15) {
      delay(1000);
      Serial.print(".");
      timeout++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println();
      Serial.println("SUCCESS: WiFi connected!");
      printConnectionDetails();
      return;
    } else {
      Serial.println(" FAILED!");
      Serial.print("Status code: ");
      printWiFiStatus(WiFi.status());
      attempts++;
      
      if (attempts < maxAttempts) {
        Serial.println("Waiting 3 seconds before retry...");
        delay(3000);
      }
    }
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFAILED: Could not connect after all attempts!");
    Serial.println("Possible issues:");
    Serial.println("1. Wrong network name (SSID)");
    Serial.println("2. Wrong password");
    Serial.println("3. Network is 5GHz only (Arduino only supports 2.4GHz)");
    Serial.println("4. Network security settings blocking device");
    Serial.println("5. Weak signal strength");
  }
}

void printConnectionDetails() {
  Serial.println("--- Connection Details ---");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP());
  
  Serial.print("Subnet mask: ");
  Serial.println(WiFi.subnetMask());
  
  Serial.print("Signal strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  
  Serial.print("MAC address: ");
  byte mac[6];
  WiFi.macAddress(mac);
  printMacAddress(mac);
}

void printEncryptionType(int thisType) {
  switch (thisType) {
    case ENC_TYPE_WEP:
      Serial.print("WEP");
      break;
    case ENC_TYPE_TKIP:
      Serial.print("WPA");
      break;
    case ENC_TYPE_CCMP:
      Serial.print("WPA2");
      break;
    case ENC_TYPE_NONE:
      Serial.print("None");
      break;
    case ENC_TYPE_AUTO:
      Serial.print("Auto");
      break;
    case ENC_TYPE_UNKNOWN:
    default:
      Serial.print("Unknown");
      break;
  }
}

void printWiFiStatus(int status) {
  switch (status) {
    case WL_CONNECTED:
      Serial.println("Connected");
      break;
    case WL_NO_SHIELD:
      Serial.println("WiFi shield not present");
      break;
    case WL_IDLE_STATUS:
      Serial.println("Idle status");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("No SSID available");
      break;
    case WL_SCAN_COMPLETED:
      Serial.println("Scan completed");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("Connection failed");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("Connection lost");
      break;
    case WL_DISCONNECTED:
      Serial.println("Disconnected");
      break;
    default:
      Serial.print("Unknown status: ");
      Serial.println(status);
      break;
  }
}

void printMacAddress(byte mac[]) {
  for (int i = 5; i >= 0; i--) {
    if (mac[i] < 16) {
      Serial.print("0");
    }
    Serial.print(mac[i], HEX);
    if (i > 0) {
      Serial.print(":");
    }
  }
  Serial.println();
}
