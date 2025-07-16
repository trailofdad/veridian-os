"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/api/sensor-routes.ts
const express_1 = require("express");
const db_1 = require("../db/db"); // Import your database instance helper
const plant_health_1 = require("../lib/plant-health");
const router = (0, express_1.Router)();
// POST /api/sensor-data
// Endpoint to receive sensor data from the serial reader script (or other sources)
// Expected req.body: an object like { "temperature": 25.3, "humidity": 60.1, "light": 500 }
router.post('/sensor-data', (req, res) => {
    // Handle both old and new formats
    const sensorData = req.body.sensorData || req.body;
    const plantId = req.body.plantId || null;
    const db = (0, db_1.getDbInstance)();
    const insertStmt = db.prepare('INSERT INTO sensor_readings (sensor_type, value, unit, plant_id) VALUES (?, ?, ?, ?)');
    try {
        // Use a transaction for atomic inserts if multiple sensor values are in one payload
        db.transaction(() => {
            for (const key in sensorData) {
                if (Object.prototype.hasOwnProperty.call(sensorData, key)) {
                    let value = sensorData[key];
                    let unit = ''; // Default unit. Consider sending from Arduino or having a more robust mapping.
                    // Basic unit mapping based on common sensor types. Expand as needed.
                    if (key === 'temperature')
                        unit = '°C';
                    else if (key === 'humidity')
                        unit = '%';
                    else if (key === 'soil_moisture')
                        unit = '%';
                    else if (key === 'illuminance')
                        unit = 'lux';
                    else if (key === 'pressure')
                        unit = 'hPa'; // Example for pressure
                    // Ensure value is a number before inserting
                    if (typeof value === 'number') {
                        insertStmt.run(key, value, unit, plantId || null);
                    }
                    else {
                        // Log a warning for non-numeric data that isn't saved
                        console.warn(`[API] Skipping non-numeric sensor data for ${key}: ${value} (Type: ${typeof value})`);
                    }
                }
            }
        })(); // Immediately invoke the transaction function
        // After saving sensor data, check for alerts
        const sensorArray = Object.keys(sensorData).map(key => ({
            sensor_type: key,
            value: sensorData[key],
            unit: (() => {
                if (key === 'temperature')
                    return '°C';
                else if (key === 'humidity')
                    return '%';
                else if (key === 'soil_moisture')
                    return '%';
                else if (key === 'illuminance')
                    return 'lux';
                else if (key === 'pressure')
                    return 'hPa';
                return '';
            })()
        })).filter(sensor => typeof sensor.value === 'number');
        (0, plant_health_1.checkAndCreateAlerts)(sensorArray);
        (0, plant_health_1.autoManageAlerts)();
        res.status(201).json({ message: 'Sensor data received and saved successfully.' });
    }
    catch (error) {
        console.error('[API] Error saving sensor data:', error);
        // Cast error to Error to safely access message property
        res.status(500).json({ message: 'Failed to save sensor data.', error: error.message });
    }
});
// GET /api/latest-sensors
// Endpoint to retrieve the most recent reading for each sensor type
// Returns an array of objects like:
// [ { id: 1, timestamp: '...', sensor_type: 'temperature', value: 25.3, unit: '°C' }, ... ]
router.get('/latest-sensors', (req, res) => {
    try {
        const db = (0, db_1.getDbInstance)();
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
    }
    catch (error) {
        console.error('[API] Error fetching latest sensor data:', error);
        res.status(500).json({ message: 'Failed to fetch latest sensor data.', error: error.message });
    }
});
// GET /api/sensor-history/:sensorType
// Endpoint to retrieve historical data for a specific sensor type
// Optional query parameters: ?limit=N (number of results), ?days=N (data from last N days)
// Returns an array of objects like:
// [ { timestamp: '...', value: 25.3, unit: '°C' }, ... ]
router.get('/sensor-history/:sensorType', (req, res) => {
    const { sensorType } = req.params; // Extract sensorType from URL parameter
    // Extract optional query parameters, providing defaults
    const { limit, days } = req.query; // limit and days will be strings from query params
    try {
        const db = (0, db_1.getDbInstance)();
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
        const params = [sensorType]; // Array to hold parameters for the prepared statement
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
    }
    catch (error) {
        console.error(`[API] Error fetching history for ${sensorType}:`, error);
        res.status(500).json({ message: `Failed to fetch history for ${sensorType}.`, error: error.message });
    }
});
// GET /api/alerts
// Endpoint to retrieve active alerts
router.get('/alerts', (req, res) => {
    try {
        const alerts = (0, plant_health_1.getActiveAlerts)();
        res.json(alerts);
    }
    catch (error) {
        console.error('[API] Error fetching alerts:', error);
        res.status(500).json({ message: 'Failed to fetch alerts.', error: error.message });
    }
});
// POST /api/alerts/:id/dismiss
// Endpoint to dismiss an alert
router.post('/alerts/:id/dismiss', (req, res) => {
    const alertId = parseInt(req.params.id);
    const { auto_dismissed } = req.body;
    if (isNaN(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID.' });
    }
    try {
        const success = (0, plant_health_1.dismissAlert)(alertId, auto_dismissed === true);
        if (success) {
            res.json({ message: 'Alert dismissed successfully.' });
        }
        else {
            res.status(404).json({ message: 'Alert not found or already dismissed.' });
        }
    }
    catch (error) {
        console.error('[API] Error dismissing alert:', error);
        res.status(500).json({ message: 'Failed to dismiss alert.', error: error.message });
    }
});
// GET /api/alerts/history
// Endpoint to retrieve alert history
// Optional query parameter: ?limit=N (number of results)
router.get('/alerts/history', (req, res) => {
    const { limit } = req.query;
    let limitNum = 50; // Default limit
    if (typeof limit === 'string' && !isNaN(parseInt(limit))) {
        limitNum = parseInt(limit);
    }
    try {
        const history = (0, plant_health_1.getAlertHistory)(limitNum);
        res.json(history);
    }
    catch (error) {
        console.error('[API] Error fetching alert history:', error);
        res.status(500).json({ message: 'Failed to fetch alert history.', error: error.message });
    }
});
// GET /api/alerts/latest
// Endpoint to retrieve the latest active alert for main notification display
router.get('/alerts/latest', (req, res) => {
    try {
        const latestAlert = (0, plant_health_1.getLatestActiveAlert)();
        res.json(latestAlert);
    }
    catch (error) {
        console.error('[API] Error fetching latest alert:', error);
        res.status(500).json({ message: 'Failed to fetch latest alert.', error: error.message });
    }
});
// GET /api/notifications/tray
// Endpoint to retrieve notification tray items (dismissed but unread alerts)
router.get('/notifications/tray', (req, res) => {
    try {
        const trayItems = (0, plant_health_1.getNotificationTrayItems)();
        res.json(trayItems);
    }
    catch (error) {
        console.error('[API] Error fetching notification tray:', error);
        res.status(500).json({ message: 'Failed to fetch notification tray.', error: error.message });
    }
});
// GET /api/notifications/unread-count
// Endpoint to get unread notification count for badge
router.get('/notifications/unread-count', (req, res) => {
    try {
        const count = (0, plant_health_1.getUnreadNotificationCount)();
        res.json({ count });
    }
    catch (error) {
        console.error('[API] Error fetching unread count:', error);
        res.status(500).json({ message: 'Failed to fetch unread count.', error: error.message });
    }
});
// POST /api/notifications/:id/mark-read
// Endpoint to mark a notification as read
router.post('/notifications/:id/mark-read', (req, res) => {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID.' });
    }
    try {
        const success = (0, plant_health_1.markAlertAsRead)(alertId);
        if (success) {
            res.json({ message: 'Notification marked as read.' });
        }
        else {
            res.status(404).json({ message: 'Notification not found.' });
        }
    }
    catch (error) {
        console.error('[API] Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read.', error: error.message });
    }
});
// Plant Management Routes
// GET /api/plants
// Endpoint to retrieve all plants
router.get('/plants', (req, res) => {
    try {
        const db = (0, db_1.getDbInstance)();
        const plants = db.prepare(`
            SELECT 
                p.*,
                ps.name as current_stage_name,
                ps.description as current_stage_description
            FROM plants p
            LEFT JOIN plant_stages ps ON p.current_stage_id = ps.id
            WHERE p.active = 1
            ORDER BY p.created_at DESC
        `).all();
        res.json(plants);
    }
    catch (error) {
        console.error('[API] Error fetching plants:', error);
        res.status(500).json({ message: 'Failed to fetch plants.', error: error.message });
    }
});
// POST /api/plants
// Endpoint to create a new plant
router.post('/plants', (req, res) => {
    const { name, species, variety, planted_date, location, notes } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Plant name is required.' });
    }
    try {
        const db = (0, db_1.getDbInstance)();
        const insertStmt = db.prepare(`
            INSERT INTO plants (name, species, variety, planted_date, location, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = insertStmt.run(name, species, variety, planted_date, location, notes);
        // Get the created plant
        const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(plant);
    }
    catch (error) {
        console.error('[API] Error creating plant:', error);
        res.status(500).json({ message: 'Failed to create plant.', error: error.message });
    }
});
// PUT /api/plants/:id
// Endpoint to update a plant
router.put('/plants/:id', (req, res) => {
    const plantId = parseInt(req.params.id);
    const { name, species, variety, planted_date, location, notes, current_stage_id } = req.body;
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    try {
        const db = (0, db_1.getDbInstance)();
        const updateStmt = db.prepare(`
            UPDATE plants 
            SET name = ?, species = ?, variety = ?, planted_date = ?, location = ?, notes = ?, current_stage_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        const result = updateStmt.run(name, species, variety, planted_date, location, notes, current_stage_id, plantId);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Plant not found.' });
        }
        // Get the updated plant
        const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(plantId);
        res.json(plant);
    }
    catch (error) {
        console.error('[API] Error updating plant:', error);
        res.status(500).json({ message: 'Failed to update plant.', error: error.message });
    }
});
// DELETE /api/plants/:id
// Endpoint to deactivate a plant
router.delete('/plants/:id', (req, res) => {
    const plantId = parseInt(req.params.id);
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    try {
        const db = (0, db_1.getDbInstance)();
        const updateStmt = db.prepare('UPDATE plants SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const result = updateStmt.run(plantId);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Plant not found.' });
        }
        res.json({ message: 'Plant deactivated successfully.' });
    }
    catch (error) {
        console.error('[API] Error deactivating plant:', error);
        res.status(500).json({ message: 'Failed to deactivate plant.', error: error.message });
    }
});
// GET /api/plant-stages
// Endpoint to retrieve all plant stages
router.get('/plant-stages', (req, res) => {
    try {
        const db = (0, db_1.getDbInstance)();
        const stages = db.prepare(`
            SELECT * FROM plant_stages
            ORDER BY order_index ASC
        `).all();
        res.json(stages);
    }
    catch (error) {
        console.error('[API] Error fetching plant stages:', error);
        res.status(500).json({ message: 'Failed to fetch plant stages.', error: error.message });
    }
});
// POST /api/plant-stages
// Endpoint to create a new plant stage
router.post('/plant-stages', (req, res) => {
    const { name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Stage name is required.' });
    }
    try {
        const db = (0, db_1.getDbInstance)();
        const insertStmt = db.prepare(`
            INSERT INTO plant_stages (name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = insertStmt.run(name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max);
        // Get the created stage
        const stage = db.prepare('SELECT * FROM plant_stages WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(stage);
    }
    catch (error) {
        console.error('[API] Error creating plant stage:', error);
        res.status(500).json({ message: 'Failed to create plant stage.', error: error.message });
    }
});
// GET /api/plants/:id/sensor-data
// Endpoint to retrieve sensor data for a specific plant
router.get('/plants/:id/sensor-data', (req, res) => {
    const plantId = parseInt(req.params.id);
    const { sensorType, limit, days } = req.query;
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    try {
        const db = (0, db_1.getDbInstance)();
        let query = `
            SELECT timestamp, sensor_type, value, unit
            FROM sensor_readings
            WHERE plant_id = ?
        `;
        const params = [plantId];
        if (sensorType) {
            query += ` AND sensor_type = ?`;
            params.push(sensorType);
        }
        if (typeof days === 'string' && !isNaN(parseFloat(days))) {
            const numDays = parseFloat(days);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - numDays);
            query += ` AND timestamp >= ?`;
            params.push(cutoffDate.toISOString());
        }
        query += ` ORDER BY timestamp DESC`;
        if (typeof limit === 'string' && !isNaN(parseInt(limit))) {
            const numLimit = parseInt(limit);
            query += ` LIMIT ?`;
            params.push(numLimit);
        }
        const sensorData = db.prepare(query).all(...params);
        res.json(sensorData);
    }
    catch (error) {
        console.error('[API] Error fetching plant sensor data:', error);
        res.status(500).json({ message: 'Failed to fetch plant sensor data.', error: error.message });
    }
});
exports.default = router; // Export the router for use in server.ts
