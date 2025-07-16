# VeridianOS

VeridianOS is a smart plant growing application with real-time monitoring and trend analysis of environmental conditions such as temperature, humidity, and soil moisture. Perfect for indoor gardeners and smart farming enthusiasts.

## Features

- **Real-Time Monitoring**: Provides live updates on plant health indicators.
- **Trend Analysis**: Offers historical data visualization for sensor readings up to a week.
- **Alerts System**: Notifies users of critical conditions needing attention.
- **Arduino Based**: Leverages Arduino MKR ENV Shield for data collection.
- **Flexible Deployment**: Supports local and containerized environments.

## Architecture

### Frontend
- **Next.js 14**: Modern React framework with app router
- **TypeScript**: Type-safe development
- **Tremor React**: Professional dashboard components
- **Tailwind CSS**: Utility-first CSS framework
- **Remix Icons**: Consistent icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **SQLite**: Lightweight database
- **TypeScript**: Type-safe server development

### Hardware
- **Arduino MKR WiFi 1010**: Main microcontroller
- **Arduino MKR ENV Shield**: Environmental sensor shield
- **Sensors**: Temperature, humidity, pressure, UV, light, and soil moisture

## Core Features

### 📊 Real-Time Dashboard
- Live sensor readings with health status indicators
- Overall plant health scoring system
- Color-coded alerts for immediate attention
- Responsive design for desktop and mobile

### 📈 Historical Trends
- Interactive charts with multiple time periods (1 hour to 1 week)
- Visual trend analysis for temperature, humidity, and soil moisture
- Proper time formatting for different viewing periods
- Auto-scaling charts with proper sizing

### 🚨 Smart Alerts System
- Automated alert generation based on sensor thresholds
- Toast notifications for immediate awareness
- Alert history and management
- Dismissible notifications with persistence

### 🌱 Plant Health Monitoring
- Configurable plant types and growth stages
- Intelligent health status calculation
- Ideal, OK, and dangerous range indicators
- Progress bars showing sensor values within optimal ranges

### 🔧 Flexible Data Sources
- Real Arduino hardware integration
- Mock data generation for development
- Automatic serial port detection
- Fallback mechanisms for reliability

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Arduino IDE (for hardware setup)
- Docker (optional, for containerized deployment)

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd veridian-os

# Install dependencies
npm install

# Start local development (auto-detects Arduino or uses mock data)
npm run dev:local
```

### Docker Development
```bash
# With mock data (no hardware required)
npm run dev:docker:mock

# With real Arduino hardware
npm run dev:docker
```

### Production Deployment
```bash
# Deploy to production (Pi 4 or server)
npm run prod:docker
```

## Development Workflows

See `DEVELOPMENT.md` for detailed development options:

- **Local Development**: Fast iteration without Docker overhead
- **Docker Development**: Full containerized environment
- **Hardware Integration**: Real Arduino sensor integration
- **Mock Data Mode**: Development without physical hardware

## Project Structure

```
veridian-os/
├── client/              # Next.js frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Utility functions and configurations
│   │   └── utils/       # Helper functions
├── server/              # Express.js backend API
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── db/          # Database configuration
│   │   ├── lib/         # Core business logic
│   │   └── scripts/     # Data collection scripts
├── arduino/             # Arduino firmware
│   └── mkr-wifi-env/    # MKR ENV Shield code
├── scripts/             # Development and deployment scripts
└── data/                # Data storage directory
```

## API Endpoints

### Sensor Data
- `GET /api/latest-sensors` - Get latest sensor readings
- `GET /api/sensor-history/{type}` - Get historical data for sensor type
- `POST /api/sensor-data` - Submit new sensor readings

### Alerts & Notifications
- `GET /api/alerts` - Get active alerts
- `GET /api/alerts/latest` - Get latest alert
- `POST /api/alerts/{id}/dismiss` - Dismiss an alert
- `GET /api/notifications/tray` - Get notification tray items
- `GET /api/notifications/unread-count` - Get unread notification count

## Hardware Setup

### Arduino Configuration
1. Install Arduino IDE and required libraries
2. Connect MKR ENV Shield to Arduino MKR WiFi 1010
3. Upload the firmware from `arduino/mkr-wifi-env/`
4. Connect via USB to your development machine

### Sensor Capabilities
- **Temperature**: -40°C to 120°C
- **Humidity**: 0% to 100% RH
- **Pressure**: 260 to 1260 hPa
- **UV Index**: 0 to 15+
- **Light**: 0 to 60000+ lux
- **Soil Moisture**: Custom analog sensor support

## Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Override API base URL
- `NODE_ENV`: Set to 'development' or 'production'
- `DATABASE_PATH`: SQLite database file path

### Plant Health Configuration
Customize plant types and health thresholds in `lib/plant-health.ts`:
- Temperature ranges for different plant types
- Humidity preferences
- Soil moisture requirements
- Light intensity needs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please refer to the project documentation or create an issue in the repository.
