// Inside server/src/api/sensor-routes.ts (add to router)
import { getDbInstance } from '../db/db.ts';
import { Router, Request, Response } from 'express';

const router = Router();
// ... other imports and router setup ...

router.post('/sensor-data', (req, res) => {
    const sensorData = req.body; // e.g., { "temperature": 25.3, "humidity": 60.1, "light": 500 }
    const db = getDbInstance();
    const insertStmt = db.prepare('INSERT INTO sensor_readings (sensor_type, value, unit) VALUES (?, ?, ?)');

    try {
        db.transaction(() => { // Use a transaction for multiple inserts
            for (const key in sensorData) {
                if (Object.prototype.hasOwnProperty.call(sensorData, key)) {
                    let value = sensorData[key];
                    let unit = ''; // Default unit, implement a helper or send from Arduino

                    // Basic type and unit mapping (expand this based on your Arduino data)
                    if (key === 'temperature') unit = '°C';
                    else if (key === 'humidity') unit = '%';
                    else if (key === 'light') unit = 'lux'; // Example

                    // You might need more robust parsing if values are complex objects
                    if (typeof value === 'number') {
                        insertStmt.run(key, value, unit);
                    } else {
                        console.warn(`Skipping non-numeric sensor data for ${key}: ${value}`);
                    }
                }
            }
        })(); // Immediately invoke the transaction
        res.status(201).send('Sensor data received and saved.');
    } catch (error) {
        console.error('Error saving sensor data:', error);
        res.status(500).send('Failed to save sensor data.');
    }
});