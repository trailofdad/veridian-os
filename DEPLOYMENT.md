# VeridianOS Deployment Guide

This guide covers Docker deployment for VeridianOS, including production builds, network access, and cross-architecture considerations.

## 🚀 Quick Start

### **Production Deployment**
```bash
# Build and start production containers
npm run docker:build:all
npm run docker:up:prod

# Monitor logs
npm run docker:logs:prod

# Stop when needed
npm run docker:down:prod
```

### **Development Deployment** 
```bash
# Start development containers (with hot reload)
npm run docker:up:dev

# Monitor logs
npm run docker:logs:dev

# Stop when needed
npm run docker:down:dev
```

## 📦 Available NPM Scripts

| Script | Purpose | Environment |
|--------|---------|-------------|
| `docker:build:client` | Build client image only | Any |
| `docker:build:server` | Build server image only | Any |
| `docker:build:all` | Build both images | Any |
| `docker:up:prod` | Start production containers | Production |
| `docker:up:dev` | Start development containers | Development |
| `docker:down:prod` | Stop production containers | Production |
| `docker:down:dev` | Stop development containers | Development |
| `docker:logs:prod` | View production logs | Production |
| `docker:logs:dev` | View development logs | Development |

## 🏗️ Docker Multi-Stage Architecture

### **Client Dockerfile Stages**
1. **`base`** - Node.js 22 Alpine base image
2. **`deps`** - Install all dependencies (root + workspace)
3. **`development`** - Development stage with hot reloading
4. **`builder`** - Production build stage (Next.js standalone)
5. **`runner`** - Production runtime stage

### **Server Dockerfile Stages**
1. **`base`** - Node.js 22 Alpine base image  
2. **`deps`** - Install dependencies + build tools
3. **`development`** - Development stage with ts-node
4. **`builder`** - Compile TypeScript
5. **`runner`** - Production runtime with compiled JS

### **Stage Targeting**
- **Development**: `target: development` (skips build/runner stages)
- **Production**: `target: runner` (includes all optimization stages)

**Build Efficiency**: Development builds are faster because Docker only builds up to the `development` stage, skipping production optimizations.

## 🌐 Network Access

### **Local Access**
- **Client**: http://localhost:3000
- **Server**: http://localhost:3001

### **Network Access (LAN)**
The deployment is automatically exposed to your local network:

1. **Find Your IP Address**:
   ```bash
   # macOS/Linux
   hostname -I
   # or
   ifconfig | grep "inet "
   ```

2. **Access from Any Device on Network**:
   - **Client**: http://YOUR_IP:3000 (e.g., http://192.168.1.100:3000)
   - **Server**: http://YOUR_IP:3001 (e.g., http://192.168.1.100:3001)

3. **Test from Mobile/Tablet**: Perfect for testing responsive design and mobile experience!

## 🍎🥧 Cross-Architecture Considerations

### **Apple Silicon Mac vs Raspberry Pi 4**
Both use ARM64 architecture but have subtle differences:

#### **NPM Package Installation Differences**
- **Issue Discovered**: `@tremor/react` packages install in different locations
  - **Apple Silicon**: `../node_modules/@tremor/` (workspace root)
  - **Raspberry Pi**: `./node_modules/@tremor/` (client workspace)
  
- **Root Cause**: npm's hoisting algorithm behaves differently between ARM64 implementations
- **Solution**: Tailwind config includes both paths for cross-compatibility

#### **Build Performance**
- **Apple Silicon**: Fast builds (M1/M2 optimization)
- **Raspberry Pi**: Slower builds (consider using `--no-cache` if needed)

#### **Binary Compatibility**
- **SWC Binary**: Dockerfile installs `@next/swc-linux-arm64-musl` for Alpine compatibility
- **Native Modules**: Generally work well, but watch for architecture-specific binaries

## 🔧 Configuration Details

### **Port Standardization**
Both development and production use Next.js standard ports:
- **Client**: 3000 (Next.js default)
- **Server**: 3001 (Next.js API convention)

### **Environment Variables**
```yaml
# Production
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_PATH=/app/data/veridian.db

# Development  
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
DATABASE_PATH=/app/data/veridian.db
```

### **Volume Mounts**
- **Development**: Source code mounted for hot reloading
- **Production**: Data directory mounted for SQLite persistence

## 🚨 Troubleshooting

### **Container Issues**
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View detailed logs
npm run docker:logs:prod

# Restart containers
npm run docker:down:prod
npm run docker:up:prod
```

### **Network Access Issues**
```bash
# Check if ports are accessible
netstat -an | grep :3000
netstat -an | grep :3001

# Test API connectivity
curl http://localhost:3001/api/latest-sensors
```

### **Build Issues**
```bash
# Force rebuild without cache
docker build --no-cache -f client/Dockerfile -t veridian-os-client:latest .

# Check disk space
df -h
docker system df
```

### **Cross-Architecture Issues**
- **Symptom**: Tremor components not styling correctly
- **Check**: Verify both Tailwind paths in `client/tailwind.config.ts`
- **Solution**: Dual-path configuration handles npm hoisting differences

## 📊 Production Considerations

### **Resource Usage**
- **RAM**: ~200MB per container (development), ~100MB (production)
- **Storage**: ~500MB for images
- **CPU**: Minimal when idle, scales with concurrent users

### **Security**
- **Non-root users**: Containers run as `nextjs`/`nodejs` users
- **Network isolation**: Custom bridge network (`veridian-network`)
- **No privileged access**: Unless Arduino serial port needed

### **Monitoring**
```bash
# Container health
docker stats

# Application logs
npm run docker:logs:prod

# System resources
htop
df -h
```

## 🌱 Happy Deploying!

Your VeridianOS deployment is now accessible across your network, optimized for production, and compatible across ARM64 architectures!
