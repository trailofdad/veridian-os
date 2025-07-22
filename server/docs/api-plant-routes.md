# Plant Management API Routes

This document describes the plant management endpoints available in `server/src/api/plant-routes.ts`.

## Base URL
All endpoints are prefixed with `/api`

---

## 🌱 Plant Management Endpoints

### GET /plants
Get all active plants with stage information.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tomato Plant #1",
    "species": "Solanum lycopersicum",
    "variety": "Cherry",
    "planted_date": "2025-01-15",
    "location": "Greenhouse A",
    "notes": "Growing well",
    "active": true,
    "created_at": "2025-01-15T08:00:00Z",
    "current_stage_name": "Vegetative",
    "current_stage_description": "Plant growing leaves and stems"
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)

---

### POST /plants
Create a new plant.

**Request Body:**
```json
{
  "name": "Tomato Plant #2",
  "species": "Solanum lycopersicum",  // optional
  "variety": "Beefsteak",            // optional
  "planted_date": "2025-01-22",      // optional
  "location": "Greenhouse B",        // optional
  "notes": "New seedling"            // optional
}
```

**Response:** Created plant object

**Status Codes:** 201 (Created), 400 (Missing name), 500 (Error)

---

### PUT /plants/:id
Update a plant.

**Path Parameters:**
- `id`: Plant ID

**Request Body:** Same as POST /plants, plus:
```json
{
  "current_stage_id": 2  // optional
}
```

**Response:** Updated plant object

**Status Codes:** 200 (OK), 400 (Invalid ID), 404 (Not Found), 500 (Error)

---

### DELETE /plants/:id
Deactivate a plant (soft delete).

**Path Parameters:**
- `id`: Plant ID

**Response:**
```json
{
  "message": "Plant deactivated successfully."
}
```

**Status Codes:** 200 (OK), 400 (Invalid ID), 404 (Not Found), 500 (Error)

---

### GET /plants/:id/sensor-data
Get sensor data for a specific plant.

**Path Parameters:**
- `id`: Plant ID

**Query Parameters:**
- `sensorType`: Filter by sensor type (optional)
- `limit`: Maximum number of results (optional)
- `days`: Number of days of history (optional)

**Response:**
```json
[
  {
    "timestamp": "2025-01-22T10:30:00Z",
    "sensor_type": "temperature",
    "value": 25.3,
    "unit": "°C"
  }
]
```

**Status Codes:** 200 (OK), 400 (Invalid ID), 500 (Error)

---

## 🎭 Plant Stage Endpoints

### GET /plant-stages
Get all plant stages ordered by sequence.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Seedling",
    "description": "Young plant just starting to grow",
    "duration_days": 14,
    "order_index": 1,
    "temperature_min": 18,
    "temperature_max": 25,
    "humidity_min": 60,
    "humidity_max": 80,
    "soil_moisture_min": 70,
    "soil_moisture_max": 85
  }
]
```

**Status Codes:** 200 (OK), 500 (Error)

---

### POST /plant-stages
Create a new plant stage.

**Request Body:**
```json
{
  "name": "Custom Stage",
  "description": "Custom growing stage",      // optional
  "duration_days": 21,                       // optional
  "order_index": 6,                          // optional
  "temperature_min": 20,                     // optional
  "temperature_max": 28,                     // optional
  "humidity_min": 45,                        // optional
  "humidity_max": 65,                        // optional
  "soil_moisture_min": 55,                   // optional
  "soil_moisture_max": 75                    // optional
}
```

**Response:** Created stage object

**Status Codes:** 201 (Created), 400 (Missing name), 500 (Error)

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
- Plant deletion is soft delete (sets `active = 0`)
- Plants include current stage information when retrieved
- Sensor data can be filtered by plant ID for plant-specific monitoring
- Stage order_index determines the sequence of growth stages
