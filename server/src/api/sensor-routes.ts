// server/src/api/sensor-routes.ts
import { Router, Request, Response } from 'express';
import { getDbInstance } from '../db/db'; // Import your database instance helper

const router = Router();

// --- Define your API Endpoints ---

// POST /api/sensor-data
// Endpoint to receive sensor data from the serial reader script (or other sources)
router.post('/sensor-data', (req: Request, res: Response) => {
    const sensorData = req.body; // Expecting an object like { "temperature": 25.3, "humidity": 60.1, "light": 500 }
    const db = getDbInstance(); // Get the SQLite database instance
    const insertStmt = db.prepare('INSERT INTO sensor_readings (sensor_type, value, unit) VALUES (?, ?, ?)');

    try {
        // Use a transaction for atomic inserts if multiple sensor values are in one payload
        db.transaction(() => {
            for (const key in sensorData) {
                if (Object.prototype.hasOwnProperty.call(sensorData, key)) {
                    let value = sensorData[key];
                    let unit = ''; // Default unit, you might want to send this from Arduino or derive more robustly

                    // Basic unit mapping (expand this based on your Arduino data)
                    if (key === 'temperature') unit = '°C';
                    else if (key === 'humidity') unit = '%';
                    else if (key === 'soil_moisture') unit = '%';
                    else if (key === 'light') unit = 'lux'; // Example light unit

                    // Ensure value is a number before inserting
                    if (typeof value === 'number') {
                        insertStmt.run(key, value, unit);
                    } else {
                        console.warn(`[API] Skipping non-numeric sensor data for ${key}: ${value}`);
                    }
                }
            }
        })(); // Immediately invoke the transaction function

        res.status(201).json({ message: 'Sensor data received and saved successfully.' });
    } catch (error) {
        console.error('[API] Error saving sensor data:', error);
        res.status(500).json({ message: 'Failed to save sensor data.', error: (error as Error).message });
    }
});

// GET /api/latest-sensors
// Endpoint to retrieve the most recent reading for each sensor type
router.get('/latest-sensors', (req: Request, res: Response) => {
    try {
        const db = getDbInstance();
        // SQL query to get the latest reading for each sensor type
        // This subquery finds the maximum timestamp for each sensor_type,
        // then joins back to get the full row for that latest timestamp.
        const latestReadings = db.prepare(`
            SELECT
                sr.id,
                sr.timestamp,
                sr.sensor_type,
                sr.value,
                sr.unit
            FROM
                sensor_readings sr
            INNER JOIN (
                SELECT
                    sensor_type,
                    MAX(timestamp) AS max_timestamp
                FROM
                    sensor_readings
                GROUP BY
                    sensor_type
            ) latest_sr ON sr.sensor_type = latest_sr.sensor_type AND sr.timestamp = latest_sr.max_timestamp
            ORDER BY
                sr.timestamp DESC;
        `).all(); // .all() retrieves all rows as an array of objects

        res.json(latestReadings);
    } catch (error) {
        console.error('[API] Error fetching latest sensor data:', error);
        res.status(500).json({ message: 'Failed to fetch latest sensor data.', error: (error as Error).message });
    }
});

// GET /api/sensor-history/:sensorType
// Endpoint to retrieve historical data for a specific sensor type
router.get('/sensor-history/:sensorType', (req: Request, res: Response) => {
    const { sensorType } = req.params;
    // Optional query parameters for limiting data (e.g., ?limit=100&days=7)
    const { limit = '500', days } = req.query; // Default to 500 points if not specified

    try {
        const db = getDbInstance();
        let query = `
            SELECT
                timestamp,
                value,
                unit
            FROM
                sensor_readings
            WHERE
                sensor_type = ?
        `;
        const params: (string | number)[] = [sensorType];

        // Filter by date if 'days' is provided
        if (days && typeof days === 'string' && !isNaN(parseInt(days))) {
            const numDays = parseInt(days);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - numDays);
            query += ` AND timestamp >= ?`; // Filter by timestamp
            params.push(cutoffDate.toISOString()); // SQLite stores DATETIME as TEXT in ISO format
        }

        query += ` ORDER BY timestamp ASC`; // Order chronologically for charts

        // Limit the number of results
        if (limit && typeof limit === 'string' && !isNaN(parseInt(limit))) {
            const numLimit = parseInt(limit);
            query += ` LIMIT ?`;
            params.push(numLimit);
        }

        const history = db.prepare(query).all(...params);
        res.json(history);
    } catch (error) {
        console.error(`[API] Error fetching history for ${sensorType}:`, error);
        res.status(500).json({ message: `Failed to fetch history for ${sensorType}.`, error: (error as Error).message });
    }
});

export default router;