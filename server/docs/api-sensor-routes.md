# Sensor Data API Routes

This document describes the sensor data endpoints available in `server/src/api/sensor-routes.ts`.

## Base URL
All endpoints are prefixed with `/api`

---

## 📊 Sensor Data Endpoints

### POST /sensor-data
Submit sensor readings to the system.

**Request Body:**
```json
{
  "temperature": 25.3,
  "humidity": 60.1,
  "soil_moisture": 45.2,
  "illuminance": 500,
  "plantId": 1  // optional
}
```

**Response:**
```json
{
  "message": "Sensor data received and saved successfully."
}
```

**Status Codes:** 201 (Created), 500 (Error)

---

### GET /latest-sensors
Get the most recent reading for each sensor type.

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2025-01-22T10:30:00Z",
    "sensor_type": "temperature",
    "value": 25.3,
    "unit": "°C"
  },
  {
    "id": 2,
    "timestamp": "2025-01-22T10:30:00Z",
    "sensor_type": "humidity",
    "value": 60.1,
    "unit": "%"
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)

---

### GET /sensor-history/:sensorType
Get historical data for a specific sensor type.

**Path Parameters:**
- `sensorType`: Type of sensor (e.g., "temperature", "humidity", "soil_moisture")

**Query Parameters:**
- `limit`: Maximum number of results (optional)
- `days`: Number of days of history to retrieve (optional)

**Example:** `GET /api/sensor-history/temperature?limit=100&days=7`

**Response:**
```json
[
  {
    "timestamp": "2025-01-22T10:30:00Z",
    "value": 25.3,
    "unit": "°C"
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)


---

## Error Response Format

All endpoints return errors in this format:
```json
{
  "message": "Error description",
  "error": "Detailed error message"  // optional
}
```

## Notes

- All timestamps are in ISO 8601 format
- Temperature values are in Celsius
- Humidity and soil moisture values are percentages
- Light values are in lux
- All numeric sensor values are stored as REAL (floating point)
- Plant deletion is soft delete (sets active = 0)
