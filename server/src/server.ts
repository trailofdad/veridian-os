// server/src/server.ts
import express from 'express';
import cors from 'cors'; // For development, allow your Next.js app to communicate
import path from 'path';
import { initializeDatabase, getDbInstance } from './db/db'; // Your DB setup
import sensorRoutes from './api/sensor-routes'; // <--- Import your new router

const app = express();
const port = 3001; // Or any other port you prefer for your API

// --- Middleware ---
// Enable CORS. In production, restrict this to your specific client origin.
app.use(cors({
    origin: 'http://localhost:3000', // Allow your Next.js dev server (usually port 3000)
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json()); // Essential for parsing JSON request bodies (from serial reader script and client)

// --- API Routes ---
// Mount your sensorRoutes under the '/api' base path
// All routes defined in sensor-routes.ts will now be prefixed with '/api'
app.use('/api', sensorRoutes);

// --- Serve Static Client Files (Optional for local development, critical for production on Pi) ---
// In a production environment on the Pi, Nginx/Caddy would often serve the static
// Next.js build files directly. For simpler local hosting, Express can do it.
// Ensure this path is correct for your monorepo structure:
// veridian-os/server/src -> veridian-os/client/out
const clientBuildPath = path.resolve(__dirname, '../../client/out'); // Next.js exports to 'out' directory for static builds
app.use(express.static(clientBuildPath));

// Catch-all for React app (for client-side routing in Next.js SSG/SPA mode)
// This serves index.html for any unmatched routes, letting Next.js handle client-side routing.
app.get('/{*any}', (req, res) => {
    // Only serve index.html for actual page requests, not API calls or static assets not found
    if (!req.path.startsWith('/api') && !req.path.includes('.')) { // Avoid intercepting API calls or static file requests
        res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    } else {
        // For actual API 404s or missing static files, let Express handle as 404
        res.status(404).send('Not Found');
    }
});

// --- Initialize Database and Start Server ---
initializeDatabase().then(() => {
    console.log('Database initialized successfully.');

    // Start the Express server
    app.listen(port, () => {
        console.log(`VeridianOS API server running on http://localhost:${port}`);
        console.log(`Serving client from ${clientBuildPath}`);
    });
}).catch(err => {
    console.error('Failed to initialize database. Server will not start:', err);
    process.exit(1);// Exit the process if database initialization fails
});

// --- Graceful Shutdown ---
// Close database connection when the Node.js process exits
process.on('exit', () => getDbInstance()?.close());
process.on('SIGINT', () => process.exit(128 + 2)); // Ctrl+C
process.on('SIGTERM', () => process.exit(128 + 15)); // kill command