# VeridianOS Development Guide

This guide covers the different ways to develop VeridianOS using local development and Docker workflows.

## 🚀 Development Options

### 1. **Local Development (Recommended for day-to-day development)**
Perfect for fast iteration without Docker overhead. Uses concurrent processes for both client and server.

```bash
# Start both client and server with hot reloading
npm run dev:local:concurrent
```

**What it does:**
- Starts Next.js client on port 3000 with hot reloading
- Starts TypeScript server on port 3001 with nodemon
- Auto-detects Arduino or falls back to mock data
- Direct access to logs and debugging tools

**Access:**
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:3001

### 2. **Docker Development**
For testing the full containerized environment with volume mounts for live development.

```bash
# Start development containers
npm run docker:up:dev

# View logs
npm run docker:logs:dev

# Stop containers
npm run docker:down:dev
```

**Features:**
- ✅ Containerized development environment
- ✅ Mock Arduino service (no hardware needed)
- ✅ Hot reloading with volume mounts
- ✅ Consistent across different machines
- ✅ Tests Docker configuration

**Access:**
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:3001

### 3. **Docker Production**
For testing production builds and deployment configuration.

```bash
# Build and start production containers
npm run docker:build:all
npm run docker:up:prod

# View production logs
npm run docker:logs:prod

# Stop production containers
npm run docker:down:prod
```

**Features:**
- ✅ Production-optimized Next.js builds (standalone)
- ✅ Compiled TypeScript server
- ✅ Next.js handles static file serving
- ✅ Auto-restart on failure
- ✅ Network accessible (0.0.0.0)

**Access:**
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:3001

## 📡 Serial Port Detection

The system automatically detects Arduino on these ports:
- **macOS:** `/dev/tty.usbmodem1101`
- **Linux:** `/dev/ttyUSB0`, `/dev/ttyACM0`
- **Other:** `/dev/tty.usbserial-*`

If no Arduino is detected, it automatically falls back to mock data generation.

## 🛠 Development Workflow

### **Recommended Workflow**
```bash
# Day-to-day development (fastest)
npm run dev:local:concurrent

# Testing Docker environment
npm run docker:up:dev

# Testing production builds
npm run docker:build:all
npm run docker:up:prod
```

### **When to Use Each Approach**
- **Local Development**: Fast iteration, debugging, most frontend/backend work
- **Docker Development**: Testing containerized environment, team consistency
- **Docker Production**: Final testing before deployment, production validation

## 🔧 Configuration

### **Environment Variables**
- `NEXT_PUBLIC_API_URL`: Override API base URL (optional)
- `NODE_ENV`: Set to 'development' or 'production'
- `DATABASE_PATH`: SQLite database file path
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry

### **Port Configuration (Standardized)**
- **All Environments**: Client(3000) → Server(3001)
- **Network Access**: Same ports accessible from any device on LAN

### **API Configuration**
The client automatically detects the correct API endpoint:
- **Browser**: Uses current hostname + port 3001
- **SSR**: Uses Docker service name or fallback URL

## 📊 Plant Health Monitoring

The system includes intelligent plant health monitoring:
- **🟢 Ideal Range:** Perfect conditions
- **🟡 OK Range:** Acceptable but could be better  
- **🔴 Dangerous Range:** Immediate attention needed

### Current Plant Configuration
- **Plant Type:** General Houseplant
- **Growth Stage:** Vegetative
- **Temperature:** 20-26°C ideal, 18-30°C OK
- **Humidity:** 50-70% ideal, 40-80% OK
- **Soil Moisture:** 40-60% ideal, 30-80% OK
- **Light:** 200-800 lux ideal, 100-1000 lux OK

## 🚨 Troubleshooting

### Serial Port Issues
```bash
# Check available ports (macOS)
ls /dev/tty.*

# Check available ports (Linux)
ls /dev/tty*

# Check Arduino connection
dmesg | grep tty  # Linux
system_profiler SPUSBDataType  # macOS
```

### Docker Issues
```bash
# Rebuild development containers
npm run docker:down:dev
npm run docker:up:dev

# Rebuild production containers
npm run docker:down:prod
npm run docker:build:all
npm run docker:up:prod

# Check container logs
npm run docker:logs:dev    # Development
npm run docker:logs:prod   # Production
```

### API Connection Issues
- **Local Development:** Check server is running on port 3001
- **Docker Development:** Check server is accessible on port 3001
- **Production:** Check API endpoints are responding on port 3001

## 📝 Adding New Features

### New Sensor Types
1. Update `plant-health.ts` with new sensor ranges
2. Add sensor display info in `dashboard/index.tsx`
3. Test with mock data first, then real hardware

### New Plant Types
1. Add plant configuration in `plant-health.ts`
2. Create UI for plant selection
3. Update database schema if needed

### New Growth Stages
1. Extend `PlantStage` type in `plant-health.ts`
2. Add stage-specific ranges
3. Update UI to show stage information

## 🌱 Happy Developing!

Choose the development option that best fits your current needs. The system is designed to be flexible and accommodate different development workflows.
