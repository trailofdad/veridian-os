// server/src/api/sensor-routes.ts
import { Router, Request, Response } from 'express';
import { getDbInstance } from '../db/db'; // Import your database instance helper

const router = Router();

// POST /api/sensor-data
// Endpoint to receive sensor data from the serial reader script (or other sources)
// Expected req.body: an object like { "temperature": 25.3, "humidity": 60.1, "light": 500 }
router.post('/sensor-data', (req: Request, res: Response) => {
    const sensorData = req.body;
    const db = getDbInstance();
    const insertStmt = db.prepare('INSERT INTO sensor_readings (sensor_type, value, unit) VALUES (?, ?, ?)');

    try {
        // Use a transaction for atomic inserts if multiple sensor values are in one payload
        db.transaction(() => {
            for (const key in sensorData) {
                if (Object.prototype.hasOwnProperty.call(sensorData, key)) {
                    let value = sensorData[key];
                    let unit = ''; // Default unit. Consider sending from Arduino or having a more robust mapping.

                    // Basic unit mapping based on common sensor types. Expand as needed.
                    if (key === 'temperature') unit = '°C';
                    else if (key === 'humidity') unit = '%';
                    else if (key === 'soil_moisture') unit = '%';
                    else if (key === 'light') unit = 'lux';
                    else if (key === 'pressure') unit = 'hPa'; // Example for pressure

                    // Ensure value is a number before inserting
                    if (typeof value === 'number') {
                        insertStmt.run(key, value, unit);
                    } else {
                        // Log a warning for non-numeric data that isn't saved
                        console.warn(`[API] Skipping non-numeric sensor data for ${key}: ${value} (Type: ${typeof value})`);
                    }
                }
            }
        })(); // Immediately invoke the transaction function

        res.status(201).json({ message: 'Sensor data received and saved successfully.' });
    } catch (error) {
        console.error('[API] Error saving sensor data:', error);
        // Cast error to Error to safely access message property
        res.status(500).json({ message: 'Failed to save sensor data.', error: (error as Error).message });
    }
});

// GET /api/latest-sensors
// Endpoint to retrieve the most recent reading for each sensor type
// Returns an array of objects like:
// [ { id: 1, timestamp: '...', sensor_type: 'temperature', value: 25.3, unit: '°C' }, ... ]
router.get('/latest-sensors', (req: Request, res: Response) => {
    try {
        const db = getDbInstance();
        // SQL query to get the latest reading for each unique sensor type.
        // It uses a subquery to find the maximum timestamp for each sensor_type,
        // then joins back to get the full row for those latest timestamps.
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
// Optional query parameters: ?limit=N (number of results), ?days=N (data from last N days)
// Returns an array of objects like:
// [ { timestamp: '...', value: 25.3, unit: '°C' }, ... ]
router.get('/sensor-history/:sensorType', (req: Request, res: Response) => {
    const { sensorType } = req.params; // Extract sensorType from URL parameter
    // Extract optional query parameters, providing defaults
    const { limit, days } = req.query; // limit and days will be strings from query params

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
        const params: (string | number)[] = [sensorType]; // Array to hold parameters for the prepared statement

        // Filter by date if 'days' is provided and is a valid number
        if (typeof days === 'string' && !isNaN(parseFloat(days))) {
            const numDays = parseFloat(days); // Use parseFloat as days could be e.g., "0.5"
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - numDays);
            query += ` AND timestamp >= ?`; // Add condition to query
            params.push(cutoffDate.toISOString()); // Push the ISO string of the cutoff date
        }

        query += ` ORDER BY timestamp ASC`; // Order chronologically for charts (oldest to newest)

        // Limit the number of results if 'limit' is provided and is a valid number
        if (typeof limit === 'string' && !isNaN(parseInt(limit))) {
            const numLimit = parseInt(limit);
            query += ` LIMIT ?`; // Add limit clause
            params.push(numLimit); // Push the limit number
        }

        const history = db.prepare(query).all(...params); // Execute the prepared statement with parameters
        res.json(history);
    } catch (error) {
        console.error(`[API] Error fetching history for ${sensorType}:`, error);
        res.status(500).json({ message: `Failed to fetch history for ${sensorType}.`, error: (error as Error).message });
    }
});

export default router; // Export the router for use in server.ts