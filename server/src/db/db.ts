// server/src/db/db.ts
import path from 'path';
import Database from 'better-sqlite3';

// This variable will hold our database instance
let db: import('better-sqlite3').Database | null = null;

// Define the path for your SQLite database file
const dbFilePath = process.env.DATABASE_PATH || path.resolve(__dirname, "../../../plant_data.db");

/**
 * Initializes the SQLite database: opens the file, enables WAL mode,
 * and creates necessary tables if they don't already exist.
 */
export async function initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            // Open the database. If the file doesn't exist, better-sqlite3 will create it.
            // 'new Database()' now refers to the constructor function we obtained via require.
            db = new Database(dbFilePath);
            console.log(`Connected to SQLite database at ${dbFilePath}`);

            // Enable WAL (Write-Ahead Logging) mode.
            db.pragma('journal_mode = WAL');

            // --- Create Tables (in correct order for foreign keys) ---
            db.exec(`
                CREATE TABLE IF NOT EXISTS automation_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_automation_logs_ts ON automation_logs (timestamp);

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS plant_stages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    duration_days INTEGER,
                    order_index INTEGER,
                    temperature_min REAL,
                    temperature_max REAL,
                    humidity_min REAL,
                    humidity_max REAL,
                    soil_moisture_min REAL,
                    soil_moisture_max REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_plant_stages_order ON plant_stages (order_index);

                CREATE TABLE IF NOT EXISTS plants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    species TEXT,
                    variety TEXT,
                    planted_date DATE,
                    current_stage_id INTEGER,
                    location TEXT,
                    notes TEXT,
                    active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (current_stage_id) REFERENCES plant_stages(id)
                );
                CREATE INDEX IF NOT EXISTS idx_plants_active ON plants (active);
                CREATE INDEX IF NOT EXISTS idx_plants_current_stage ON plants (current_stage_id);

                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sensor_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    unit TEXT,
                    plant_id INTEGER,
                    FOREIGN KEY (plant_id) REFERENCES plants(id)
                );
                CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_ts ON sensor_readings (sensor_type, timestamp);
                CREATE INDEX IF NOT EXISTS idx_sensor_readings_plant_id ON sensor_readings (plant_id);

                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sensor_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    value REAL NOT NULL,
                    unit TEXT,
                    dismissed BOOLEAN DEFAULT 0,
                    dismissed_at DATETIME NULL,
                    auto_dismissed BOOLEAN DEFAULT 0,
                    read BOOLEAN DEFAULT 0,
                    plant_id INTEGER,
                    FOREIGN KEY (plant_id) REFERENCES plants(id)
                );
                CREATE INDEX IF NOT EXISTS idx_alerts_sensor_type ON alerts (sensor_type);
                CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON alerts (dismissed);
                CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp);
                CREATE INDEX IF NOT EXISTS idx_alerts_plant_id ON alerts (plant_id);

                CREATE TABLE IF NOT EXISTS plant_stage_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plant_id INTEGER NOT NULL,
                    stage_id INTEGER NOT NULL,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ended_at DATETIME NULL,
                    notes TEXT,
                    FOREIGN KEY (plant_id) REFERENCES plants(id),
                    FOREIGN KEY (stage_id) REFERENCES plant_stages(id)
                );
                CREATE INDEX IF NOT EXISTS idx_plant_stage_history_plant ON plant_stage_history (plant_id);
                CREATE INDEX IF NOT EXISTS idx_plant_stage_history_stage ON plant_stage_history (stage_id);
                CREATE INDEX IF NOT EXISTS idx_plant_stage_history_dates ON plant_stage_history (started_at, ended_at);
            `);
            
            // Migration: Add new columns to existing tables if they don't exist
            try {
                // Check alerts table columns
                const alertsColumns = db.pragma('table_info(alerts)') as Array<{ name: string; type: string; notnull: number; dflt_value: any; pk: number }>;
                const hasAutoDismissed = alertsColumns.some((col) => col.name === 'auto_dismissed');
                const hasRead = alertsColumns.some((col) => col.name === 'read');
                const hasPlantIdInAlerts = alertsColumns.some((col) => col.name === 'plant_id');
                
                if (!hasAutoDismissed) {
                    console.log('Adding auto_dismissed column to alerts table...');
                    db.exec('ALTER TABLE alerts ADD COLUMN auto_dismissed BOOLEAN DEFAULT 0');
                }
                
                if (!hasRead) {
                    console.log('Adding read column to alerts table...');
                    db.exec('ALTER TABLE alerts ADD COLUMN read BOOLEAN DEFAULT 0');
                }
                
                if (!hasPlantIdInAlerts) {
                    console.log('Adding plant_id column to alerts table...');
                    db.exec('ALTER TABLE alerts ADD COLUMN plant_id INTEGER');
                }
                
                // Check sensor_readings table columns
                const sensorColumns = db.pragma('table_info(sensor_readings)') as Array<{ name: string; type: string; notnull: number; dflt_value: any; pk: number }>;
                const hasPlantIdInSensors = sensorColumns.some((col) => col.name === 'plant_id');
                
                if (!hasPlantIdInSensors) {
                    console.log('Adding plant_id column to sensor_readings table...');
                    db.exec('ALTER TABLE sensor_readings ADD COLUMN plant_id INTEGER');
                }
            } catch (migrationError) {
                console.log('Migration completed or not needed:', migrationError);
            }
            
            // Seed default plant stages if none exist
            try {
                const existingStages = db.prepare('SELECT COUNT(*) as count FROM plant_stages').get() as { count: number };
                if (existingStages.count === 0) {
                    console.log('Seeding default plant stages...');
                    const seedStages = [
                        { name: 'Seedling', description: 'Young plant just starting to grow', duration_days: 14, order_index: 1, temperature_min: 18, temperature_max: 25, humidity_min: 60, humidity_max: 80, soil_moisture_min: 70, soil_moisture_max: 85 },
                        { name: 'Vegetative', description: 'Plant growing leaves and stems', duration_days: 28, order_index: 2, temperature_min: 20, temperature_max: 28, humidity_min: 50, humidity_max: 70, soil_moisture_min: 60, soil_moisture_max: 80 },
                        { name: 'Flowering', description: 'Plant producing flowers', duration_days: 21, order_index: 3, temperature_min: 22, temperature_max: 26, humidity_min: 45, humidity_max: 65, soil_moisture_min: 55, soil_moisture_max: 75 },
                        { name: 'Fruiting', description: 'Plant producing fruit', duration_days: 35, order_index: 4, temperature_min: 20, temperature_max: 25, humidity_min: 40, humidity_max: 60, soil_moisture_min: 50, soil_moisture_max: 70 },
                        { name: 'Harvest', description: 'Plant ready for harvest', duration_days: 7, order_index: 5, temperature_min: 18, temperature_max: 22, humidity_min: 40, humidity_max: 55, soil_moisture_min: 45, soil_moisture_max: 65 }
                    ];
                    
                    const insertStageStmt = db.prepare(`
                        INSERT INTO plant_stages (name, description, duration_days, order_index, temperature_min, temperature_max, humidity_min, humidity_max, soil_moisture_min, soil_moisture_max)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    for (const stage of seedStages) {
                        insertStageStmt.run(stage.name, stage.description, stage.duration_days, stage.order_index, stage.temperature_min, stage.temperature_max, stage.humidity_min, stage.humidity_max, stage.soil_moisture_min, stage.soil_moisture_max);
                    }
                    
                    console.log('Default plant stages seeded successfully.');
                }
            } catch (seedError) {
                console.log('Seeding error (may be normal):', seedError);
            }
            
            console.log('Database tables ensured (created or already exist).');
            resolve();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            if (db) {
                db.close();
                db = null;
            }
            reject(error);
        }
    });
}

/**
 * Returns the initialized SQLite database instance.
 * Throws an error if the database has not been initialized yet.
 */
export function getDbInstance(): import('better-sqlite3').Database {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}