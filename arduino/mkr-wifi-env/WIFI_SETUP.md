# Arduino WiFi Setup Guide

This guide will help you set up your Arduino MKR WiFi 1010 with MKR ENV Shield to send sensor data directly to your VeridianOS API via WiFi.

## Required Libraries

Install these libraries through the Arduino IDE Library Manager:

1. **Arduino_MKRENV** - For the environmental sensor shield
2. **WiFiNINA** - For WiFi connectivity (usually pre-installed)
3. **ArduinoHttpClient** - For HTTP requests
4. **ArduinoJson** - For JSON handling (optional, we use manual JSON creation)

## Hardware Setup

1. **Arduino MKR WiFi 1010** - Main microcontroller
2. **Arduino MKR ENV Shield** - Environmental sensors
3. **Soil moisture sensor** - Connected to analog pin A0
4. **USB cable** - For programming and power

## Configuration Steps

### 1. Update WiFi Credentials

In `env-wifi-dual.ino`, update these lines:

```cpp
// WiFi credentials - Replace with your network details
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Configure Server Settings

Update the server configuration to match your setup:

```cpp
// Server configuration - Replace with your server details
const char* serverAddress = "192.168.1.100";  // Your server IP or hostname
const int serverPort = 3001;                   // Your server port
const char* apiEndpoint = "/api/sensor-data";  // API endpoint path
```

**Finding Your Server IP:**
- If running locally: Use `localhost` or `127.0.0.1`
- If running on your network: Find your computer's IP address
  - Mac/Linux: Run `ifconfig` and look for your WiFi adapter
  - Windows: Run `ipconfig` and look for your WiFi adapter
- If running in Docker: Use your host machine's IP address

### 3. Choose Connection Mode

Set the connection mode at the top of the file:

```cpp
#define USE_WIFI true        // Set to false to use serial mode
```

- **`true`**: Uses WiFi to send data directly to API (with serial fallback)
- **`false`**: Uses serial output only (like your original script)

## Features

### Dual Mode Operation
- **WiFi Mode**: Sends data directly to your API via HTTP POST
- **Serial Fallback**: Automatically falls back to serial output if WiFi fails
- **Mode Switch**: Easy configuration to switch between WiFi and serial-only

### Smart WiFi Handling
- **Auto-reconnect**: Automatically reconnects if WiFi connection is lost
- **Connection retry**: Retries failed connections every 30 seconds
- **Status monitoring**: Real-time connection status feedback
- **Graceful fallback**: Falls back to serial when WiFi is unavailable

### Error Handling
- **HTTP error handling**: Properly handles API response codes
- **Network failures**: Graceful handling of network issues
- **Module detection**: Detects if WiFi module is present and working
- **Timeout protection**: Prevents hanging on connection attempts

## Usage

### 1. Upload the Script
1. Open `env-wifi-dual.ino` in Arduino IDE
2. Configure your WiFi credentials and server settings
3. Select your board: **Arduino MKR WiFi 1010**
4. Select the correct port
5. Upload the script

### 2. Monitor Serial Output
Open the Serial Monitor (115200 baud) to see:
- Connection status
- Sensor readings
- HTTP response codes
- Error messages
- Fallback notifications

### 3. Verify Data Reception
Check your VeridianOS dashboard to confirm data is being received via WiFi.

## Serial Monitor Output Examples

### Successful WiFi Connection:
```
=== VeridianOS Arduino Sensor Node ===
Mode: WiFi
Connecting to WiFi network: MyNetwork
WiFi connected successfully!
IP address: 192.168.1.150
Signal strength (RSSI): -45 dBm
Sending to 192.168.1.100:3001/api/sensor-data
HTTP Status: 201
✓ Data sent successfully via WiFi
```

### WiFi Failure with Serial Fallback:
```
WiFi connection lost!
WiFi unavailable - outputting to serial:
{"temperature": 23.45, "humidity": 65.20, "soil_moisture": 128, ...}
```

## Troubleshooting

### WiFi Test Script (Recommended First Step)

If you're having WiFi connection issues, start with the dedicated test script:

1. **Upload `wifi-test/wifi-test.ino`** first before using the main script
2. **Open Serial Monitor** to see detailed diagnostic information
3. **Review the output** for specific error messages and network scan results

**What the test script tells you:**
- ✅ **"TARGET NETWORK FOUND!"** - Your network is visible and accessible
- ❌ **"Target network not found"** - Network name issue or wrong frequency (5GHz vs 2.4GHz)
- **Available networks list** - Shows all networks the Arduino can see
- **Signal strength (RSSI)** - Indicates if you're too far from router
- **Detailed error codes** - Specific failure reasons (wrong password, connection timeout, etc.)
- **Firmware version** - Confirms WiFi module is working

**Example test output:**
```
=== WiFi Connection Test ===
Firmware version: 1.4.8

--- Scanning for networks ---
Number of available networks: 12
0) MyNetwork_5G     Signal: -45 dBm    Encryption: WPA2
1) Dumb Potato Basket Signal: -52 dBm  Encryption: WPA2 <- TARGET NETWORK FOUND!
2) NeighborWiFi     Signal: -78 dBm    Encryption: WPA2

--- Attempting to connect ---
Attempt 1/5 - Connecting to: Dumb Potato Basket
...........
SUCCESS: WiFi connected!
IP address: 192.168.50.200
Signal strength (RSSI): -52 dBm
```

Only proceed to the main script after the test script successfully connects.

### WiFi Connection Issues
1. **Check credentials**: Verify SSID and password are correct
2. **Signal strength**: Ensure Arduino is close enough to router (RSSI > -70 dBm is good)
3. **Network compatibility**: Ensure your network supports 2.4GHz (MKR WiFi doesn't support 5GHz)
4. **Firewall**: Check if your firewall is blocking the connection

### API Connection Issues
1. **Server address**: Verify the IP address/hostname is correct
2. **Port number**: Ensure the port matches your server configuration
3. **Network access**: Ensure Arduino can reach your server's network
4. **API endpoint**: Verify the endpoint path is correct (`/api/sensor-data`)

### Serial Fallback
If WiFi fails, the Arduino will automatically output JSON data to serial, allowing your existing serial reader script to continue working.

## Benefits of WiFi Mode

1. **Reduced wiring**: No need for USB cable after initial setup
2. **Remote placement**: Place Arduino anywhere within WiFi range
3. **Lower latency**: Direct API calls instead of serial processing
4. **Better reliability**: Automatic reconnection and error handling
5. **Dual redundancy**: Serial fallback ensures continuous operation

## Power Considerations

When running on WiFi:
- **USB power**: Simplest option for development
- **Battery pack**: For remote/portable installations
- **External power supply**: For permanent installations

WiFi uses more power than serial mode, so consider power requirements for your deployment.
