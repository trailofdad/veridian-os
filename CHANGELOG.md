# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [0.5.1](https://github.com/trailofdad/veridian-os/compare/v0.5.0...v0.5.1) (2025-07-22)


### ### Added

* comprehensive notification middleware system ([cb0b530](https://github.com/trailofdad/veridian-os/commit/cb0b530021eac1c5bff2a53637613837add1476b))

## [0.5.0](https://github.com/trailofdad/veridian-os/compare/v0.4.1...v0.5.0) (2025-07-22)


### ⚠ BREAKING CHANGES

* Restructured API route files for better maintainability

- Refactor monolithic sensor-routes.ts into focused modules:
  * sensor-routes.ts: Pure sensor data endpoints (3 endpoints)
  * plant-routes.ts: Plant & stage management (7 endpoints)
  * notification-routes.ts: Alerts & notifications (7 endpoints)
  * user-routes.ts: User & settings management (7 endpoints)

- Add comprehensive API documentation:
  * Complete endpoint documentation for all route files
  * Request/response examples and status codes
  * Architecture overview and security considerations
  * Developer onboarding and testing guides

- Improve code organization and maintainability:
  * Single responsibility principle for each route file
  * Better separation of concerns
  * Easier navigation and development
  * Cleaner git history for future changes

- Update server configuration:
  * Import and configure all 4 route modules
  * Maintain existing middleware and CORS setup
  * Verified build compatibility

All endpoints remain functionally identical with no API changes.

### ### Added

* refactor API routes and add comprehensive documentation ([5f425ee](https://github.com/trailofdad/veridian-os/commit/5f425eeff42514f2cf08538a0a7e2aa4a8ef5a27))

### [0.4.1](https://github.com/trailofdad/veridian-os/compare/v0.4.0...v0.4.1) (2025-07-22)


### ### Added

* add user management system with settings support ([e67a324](https://github.com/trailofdad/veridian-os/commit/e67a3248068df487cf0adc582c8f156a6f7e413c))


### ### Fixed

* TypeScript errors in user-routes endpoints ([b7ec6cc](https://github.com/trailofdad/veridian-os/commit/b7ec6cc65c779a7fef00619bd68551d09897d687))

## [0.4.0](https://github.com/trailofdad/veridian-os/compare/v0.3.0...v0.4.0) (2025-07-22)


### ### Infrastructure

* add automated release management with standard-version ([9697e33](https://github.com/trailofdad/veridian-os/commit/9697e33cacbfaf76732d06718c0a188a9a918a2c))


### ### Changed

* extract SensorCard component from dashboard ([2983aab](https://github.com/trailofdad/veridian-os/commit/2983aab64e98a395cf6063a56b6329f6de18db9a))


### ### Fixed

* improve code organization and extract reusable constants ([6ae9962](https://github.com/trailofdad/veridian-os/commit/6ae99621e13494b6d0581446ee84d1e4cccd5433))


### ### Added

* major dashboard refactor - modularize components and fix polling ([fa14199](https://github.com/trailofdad/veridian-os/commit/fa14199cf85e487e3808d6251b422cb2e6bcc7f8))
* major dashboard refactor and component modularization ([e6205c6](https://github.com/trailofdad/veridian-os/commit/e6205c64f286f412bc78752925610fb81dc81885))

## [0.3.0] - 2025-07-21

### Added
- **WiFi capabilities** for Arduino MKR ENV sensors with direct HTTP POST to API
- **Dual-mode Arduino script** (`env-wifi-dual.ino`) supporting WiFi and automatic serial fallback
- **WiFi diagnostics tool** (`wifi-test.ino`) for network troubleshooting and connection testing
- **Comprehensive WiFi setup guide** with step-by-step configuration and troubleshooting
- **Network scanning functionality** to detect available networks and signal strength
- **Smart error handling** with detailed status codes and connection diagnostics

### Technical Improvements
- **Automatic reconnection logic** with periodic retry for lost WiFi connections
- **2.4GHz network support** ensuring compatibility with Arduino MKR WiFi 1010
- **HTTP client integration** using ArduinoHttpClient library for reliable API communication
- **Serial fallback mechanism** maintaining compatibility with existing serial reader infrastructure
- **Signal strength monitoring** (RSSI) for connection quality assessment
- **Timeout optimization** preventing connection hanging and improving stability

### Fixed
- **Hardcoded WiFi credentials** issue preventing dynamic network configuration
- **Connection timeout logic** that was causing excessive wait times (90s → 10s)
- **WiFi retry mechanism** with proper delay intervals and attempt limiting
- **Variable scope issues** in Arduino struct declarations

### Infrastructure
- **Version bump** across all package.json files (0.2.0 → 0.3.0)
- **New Arduino file structure** with organized WiFi implementations
- **Documentation updates** including troubleshooting guides and example outputs

## [0.2.0] - 2025-01-21

### Added
- **Multi-architecture Docker deployment** with support for development and production stages
- **Complete containerization** of both client and server applications
- **Docker Compose configurations** for development (`docker-compose.dev.yml`) and production (`docker-compose.prod.yml`) environments
- **Cross-platform deployment scripts** maintaining monorepo structure
- **Production-ready Docker setup** with optimized builds for multiple architectures
- **Streamlined deployment workflow** via Docker containers
- **Development and production Docker targets** for efficient builds
- **Container orchestration** while preserving monorepo benefits

### Technical Improvements
- **Dockerfile optimization** for both client (Next.js) and server (Node.js/Express) applications
- **Multi-stage Docker builds** for reduced production image sizes
- **Docker networking** configuration for seamless client-server communication
- **Environment-specific configurations** for development vs production deployments
- **Container health checks** and proper service dependencies
- **Volume management** for persistent data storage in containerized environments

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
