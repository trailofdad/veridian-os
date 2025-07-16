# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-16

### Added
- **Real-time plant monitoring dashboard** with live sensor readings
- **Historical trend analysis** with interactive charts (1 hour to 1 week)
- **Smart alerts system** with automated notifications for dangerous conditions
- **Arduino hardware integration** with MKR ENV Shield support
- **Mock data generation** for development without physical hardware
- **Flexible deployment options** (local development, Docker, production)
- **Plant health scoring** with configurable thresholds
- **Notification system** with toast notifications and dismissible alerts
- **Multiple time period support** for historical data visualization
- **Responsive design** for desktop and mobile devices
- **TypeScript support** throughout the codebase
- **Database storage** with SQLite for sensor data and alerts
- **API endpoints** for sensor data, alerts, and notifications
- **Development scripts** for various deployment scenarios
- **Comprehensive documentation** with setup guides and API reference

### Technical Features
- **Frontend**: Next.js 14, React 18, TypeScript, Tremor React, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, SQLite, better-sqlite3
- **Hardware**: Arduino MKR WiFi 1010 + MKR ENV Shield
- **Sensors**: Temperature, humidity, pressure, UV, light, soil moisture
- **Deployment**: Docker support, Nginx configuration, Pi 4 ready
- **Development**: Hot reload, mock data, concurrent development

### Fixed
- **Chart sizing issues** - Fixed "width(0) and height(0)" warnings
- **404 error handling** - Graceful handling of dismissed alerts
- **Race conditions** - Prevention of duplicate alert dismissals
- **Time formatting** - Proper timestamp formatting for different periods
- **Notification persistence** - Improved alert state management

### Removed
- **Dead code cleanup** - Removed unused dashboard components
- **Duplicate notifications** - Consolidated notification systems
- **Development logs** - Cleaned up console.log statements
- **Unused dependencies** - Removed redundant packages

### Security
- **Input validation** - Proper sanitization of sensor data
- **Error handling** - Comprehensive error catching and logging
- **CORS configuration** - Secure cross-origin resource sharing
- **Database prepared statements** - SQL injection prevention

## [Unreleased]

### Planned
- User authentication and multi-user support
- Plant type management and customization
- Mobile app companion
- Integration with additional sensor types
- Advanced analytics and reporting
- Email/SMS alert notifications
- Weather API integration
- Plant care recommendations
- Data export functionality
- Custom dashboard themes
