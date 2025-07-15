// server/src/db/db.ts
import path from 'path';

// Use require for the actual runtime import of the better-sqlite3 module.
// We're essentially telling TypeScript: "Trust me, this 'require' call
// returns the constructor function for the Database class."
const Database = require('better-sqlite3') as { new (filename: string, options?: import('better-sqlite3').Options): import('better-sqlite3').Database };

// This variable will hold our database instance
let db: import('better-sqlite3').Database | null = null;

// Define the path for your SQLite database file
const dbFilePath = path.resolve(__dirname, '../../../plant_data.db');

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

            // --- Create Tables ---
            db.exec(`
                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sensor_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    unit TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_ts ON sensor_readings (sensor_type, timestamp);

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
            `);
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