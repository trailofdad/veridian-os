"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // For development, allow your Next.js app to communicate
const path_1 = __importDefault(require("path"));
const db_1 = require("./db/db"); // Your DB setup
const sensor_routes_1 = __importDefault(require("./api/sensor-routes")); // <--- Import your new router
const app = (0, express_1.default)();
const port = 3001; // Or any other port you prefer for your API
// --- Middleware ---
// Enable CORS. In production, restrict this to your specific client origin.
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Allow your Next.js dev server (usually port 3000)
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express_1.default.json()); // Essential for parsing JSON request bodies (from serial reader script and client)
// --- API Routes ---
// Mount your sensorRoutes under the '/api' base path
// All routes defined in sensor-routes.ts will now be prefixed with '/api'
app.use('/api', sensor_routes_1.default);
// --- Serve Static Client Files (Optional for local development, critical for production on Pi) ---
// In a production environment on the Pi, Nginx/Caddy would often serve the static
// Next.js build files directly. For simpler local hosting, Express can do it.
// Ensure this path is correct for your monorepo structure:
// veridian-os/server/src -> veridian-os/client/out
const clientBuildPath = path_1.default.resolve(__dirname, '../../client/out'); // Next.js exports to 'out' directory for static builds
app.use(express_1.default.static(clientBuildPath));
// Catch-all for React app (for client-side routing in Next.js SSG/SPA mode)
// This serves index.html for any unmatched routes, letting Next.js handle client-side routing.
app.get('/{*any}', (req, res) => {
    // Only serve index.html for actual page requests, not API calls or static assets not found
    if (!req.path.startsWith('/api') && !req.path.includes('.')) { // Avoid intercepting API calls or static file requests
        res.sendFile(path_1.default.resolve(clientBuildPath, 'index.html'));
    }
    else {
        // For actual API 404s or missing static files, let Express handle as 404
        res.status(404).send('Not Found');
    }
});
// --- Initialize Database and Start Server ---
(0, db_1.initializeDatabase)().then(() => {
    console.log('Database initialized successfully.');
    // Start the Express server
    app.listen(port, () => {
        console.log(`VeridianOS API server running on http://localhost:${port}`);
        console.log(`Serving client from ${clientBuildPath}`);
    });
}).catch(err => {
    console.error('Failed to initialize database. Server will not start:', err);
    process.exit(1); // Exit the process if database initialization fails
});
// --- Graceful Shutdown ---
// Close database connection when the Node.js process exits
process.on('exit', () => (0, db_1.getDbInstance)()?.close());
process.on('SIGINT', () => process.exit(128 + 2)); // Ctrl+C
process.on('SIGTERM', () => process.exit(128 + 15)); // kill command
