// server/src/api/plant-routes.ts
import { Router, Request, Response } from 'express';
import { getDbInstance } from '../db/db';

const router = Router();

// GET /api/plants
// Endpoint to retrieve all plants
router.get('/plants', (req: Request, res: Response) => {
    try {
        const db = getDbInstance();
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
    } catch (error) {
        console.error('[API] Error fetching plants:', error);
        res.status(500).json({ message: 'Failed to fetch plants.', error: (error as Error).message });
    }
});

// POST /api/plants
// Endpoint to create a new plant
router.post('/plants', (req: Request, res: Response) => {
    const { name, species, variety, planted_date, location, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Plant name is required.' });
    }
    
    try {
        const db = getDbInstance();
        const insertStmt = db.prepare(`
            INSERT INTO plants (name, species, variety, planted_date, location, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(name, species, variety, planted_date, location, notes);
        
        // Get the created plant
        const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(result.lastInsertRowid);
        
        res.status(201).json(plant);
    } catch (error) {
        console.error('[API] Error creating plant:', error);
        res.status(500).json({ message: 'Failed to create plant.', error: (error as Error).message });
    }
});

// PUT /api/plants/:id
// Endpoint to update a plant
router.put('/plants/:id', (req: Request, res: Response) => {
    const plantId = parseInt(req.params.id);
    const { name, species, variety, planted_date, location, notes, current_stage_id } = req.body;
    
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    
    try {
        const db = getDbInstance();
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
    } catch (error) {
        console.error('[API] Error updating plant:', error);
        res.status(500).json({ message: 'Failed to update plant.', error: (error as Error).message });
    }
});

// DELETE /api/plants/:id
// Endpoint to deactivate a plant
router.delete('/plants/:id', (req: Request, res: Response) => {
    const plantId = parseInt(req.params.id);
    
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    
    try {
        const db = getDbInstance();
        const updateStmt = db.prepare('UPDATE plants SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        
        const result = updateStmt.run(plantId);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Plant not found.' });
        }
        
        res.json({ message: 'Plant deactivated successfully.' });
    } catch (error) {
        console.error('[API] Error deactivating plant:', error);
        res.status(500).json({ message: 'Failed to deactivate plant.', error: (error as Error).message });
    }
});

// GET /api/plants/:id/sensor-data
// Endpoint to retrieve sensor data for a specific plant
router.get('/plants/:id/sensor-data', (req: Request, res: Response) => {
    const plantId = parseInt(req.params.id);
    const { sensorType, limit, days } = req.query;
    
    if (isNaN(plantId)) {
        return res.status(400).json({ message: 'Invalid plant ID.' });
    }
    
    try {
        const db = getDbInstance();
        let query = `
            SELECT timestamp, sensor_type, value, unit
            FROM sensor_readings
            WHERE plant_id = ?
        `;
        const params: (string | number)[] = [plantId];
        
        if (sensorType) {
            query += ` AND sensor_type = ?`;
            params.push(sensorType as string);
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
    } catch (error) {
        console.error('[API] Error fetching plant sensor data:', error);
        res.status(500).json({ message: 'Failed to fetch plant sensor data.', error: (error as Error).message });
    }
});

// GET /api/plant-stages
// Endpoint to retrieve all plant stages
router.get('/plant-stages', (req: Request, res: Response) => {
    try {
        const db = getDbInstance();
        const stages = db.prepare(`
            SELECT * FROM plant_stages
            ORDER BY order_index ASC
        `).all();
        res.json(stages);
    } catch (error) {
        console.error('[API] Error fetching plant stages:', error);
        res.status(500).json({ message: 'Failed to fetch plant stages.', error: (error as Error).message });
    }
});

// POST /api/plant-stages
// Endpoint to create a new plant stage
router.post('/plant-stages', (req: Request, res: Response) => {
    const { name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Stage name is required.' });
    }
    
    try {
        const db = getDbInstance();
        const insertStmt = db.prepare(`
            INSERT INTO plant_stages (name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max);
        
        // Get the created stage
        const stage = db.prepare('SELECT * FROM plant_stages WHERE id = ?').get(result.lastInsertRowid);
        
        res.status(201).json(stage);
    } catch (error) {
        console.error('[API] Error creating plant stage:', error);
        res.status(500).json({ message: 'Failed to create plant stage.', error: (error as Error).message });
    }
});

export default router;
