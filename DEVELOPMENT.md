# VeridianOS Development Guide

This guide covers the different ways to develop and run VeridianOS based on your needs.

## 🚀 Development Options

### 1. **Local Development (Recommended for day-to-day development)**
Perfect for when you want to develop without Docker overhead and don't have an Arduino connected.

```bash
# Start local development (auto-detects Arduino or falls back to mock data)
./scripts/dev-local.sh

# Or manually:
npm run dev:local
```

**Features:**
- ✅ Auto-detects Arduino serial port
- ✅ Falls back to mock data if no Arduino found
- ✅ Fast development cycle (no Docker rebuild)
- ✅ Direct access to logs and debugging
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:3001

### 2. **Docker Development with Mock Data**
Great for testing the full Docker environment with consistent mock data.

```bash
# Start Docker development with mock Arduino service
./scripts/dev-mock.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

**Features:**
- ✅ Full Docker environment
- ✅ Mock Arduino service (no hardware needed)
- ✅ Consistent across team members
- ✅ Live reload with volume mounts
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:8000

### 3. **Docker Development with Real Arduino**
For testing actual hardware integration in a containerized environment.

```bash
# Start Docker development with real Arduino support
./scripts/dev.sh

# Or manually:
docker-compose up --build
```

**Features:**
- ✅ Real Arduino hardware integration
- ✅ USB device passthrough
- ✅ Production-like environment
- ⚠️ Requires Arduino connected to supported port
- 🌐 **Client:** http://localhost:3000
- 🔌 **Server:** http://localhost:8000

### 4. **Production Deployment**
For deploying to your Pi 4 or production server.

```bash
# Deploy to production (Pi 4)
./scripts/prod.sh

# Or manually:
docker-compose -f docker-compose.prod.yml up --build -d
```

**Features:**
- ✅ Production-optimized builds
- ✅ Nginx reverse proxy
- ✅ SSL support (optional)
- ✅ Auto-restart on failure
- 🌐 **Application:** http://localhost (via nginx)

## 📡 Serial Port Detection

The system automatically detects Arduino on these ports:
- **macOS:** `/dev/tty.usbmodem1101`
- **Linux:** `/dev/ttyUSB0`, `/dev/ttyACM0`
- **Other:** `/dev/tty.usbserial-*`

If no Arduino is detected, it automatically falls back to mock data generation.

## 🛠 Development Workflow

### For Frontend Development:
```bash
./scripts/dev-local.sh  # Mock data, fast iteration
```

### For Backend Development:
```bash
./scripts/dev-local.sh  # Direct server access, easy debugging
```

### For Full Stack Testing:
```bash
./scripts/dev-mock.sh   # Docker environment, consistent data
```

### For Hardware Integration:
```bash
./scripts/dev.sh        # Real Arduino, full system test
```

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Override API base URL
- `NODE_ENV`: Set to 'development' or 'production'
- `DATABASE_PATH`: SQLite database file path

### Port Configuration
- **Local Development:** Client(3000) → Server(3001)
- **Docker Development:** Client(3000) → Server(8000→3001)
- **Production:** Nginx(80) → Client(3000) + Server(8000→3001)

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
# Rebuild containers
docker-compose down
docker-compose up --build

# Check container logs
docker-compose logs -f server
docker-compose logs -f client
```

### API Connection Issues
- **Local Development:** Check server is running on port 3001
- **Docker Development:** Check server is mapped to port 8000
- **Production:** Check nginx configuration

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
