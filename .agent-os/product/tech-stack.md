# Technical Stack

> Last Updated: 2025-07-29
> Version: 1.0.0

## Frontend Technologies

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5.8.3
- **Styling:** Tailwind CSS 3.4+ with @tailwindcss/forms
- **UI Components:** Tremor React 3.18+ (Professional dashboard components)
- **Icons:** Remix Icons (@remixicon/react)
- **Fonts:** Geist font family
- **Animation:** Framer Motion 12+
- **Utilities:** clsx, tailwind-merge, tailwind-variants

## Backend Technologies

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js 5.1+
- **Database:** SQLite with better-sqlite3
- **CORS:** cors middleware for cross-origin requests
- **Serial Communication:** serialport 13+ for Arduino integration
- **HTTP Client:** node-fetch for external API calls
- **Development:** ts-node, concurrently for process management

## Hardware Integration

- **Microcontroller:** Arduino MKR WiFi 1010
- **Sensor Shield:** Arduino MKR ENV Shield
- **Communication:** Dual-mode WiFi/Serial with automatic fallback
- **Sensors:** Temperature, Humidity, Pressure, UV, Light, Soil Moisture

## AI and External Services

- **AI Provider:** Google Generative AI (@google/generative-ai)
- **Integration:** Native AI insights and plant diagnosis capabilities

## Development Tools

- **Package Manager:** npm with workspaces (monorepo structure)
- **Linting:** ESLint with Next.js config and Prettier integration
- **Build Tools:** TypeScript compiler, Next.js build system
- **Process Management:** concurrently for running multiple services

## Deployment and Infrastructure

- **Containerization:** Docker with multi-stage builds
- **Orchestration:** Docker Compose (development and production configs)
- **Target Platform:** ARM64 (Raspberry Pi 4 compatible)
- **Reverse Proxy:** Nginx (optional, for production)
- **Data Persistence:** Docker volumes for database and file storage

## Architecture Patterns

- **Project Structure:** Monorepo with client/server workspaces
- **Database Design:** Relational SQLite with foreign key constraints
- **API Design:** RESTful endpoints with modular route organization
- **Notification System:** Pluggable middleware architecture
- **State Management:** React hooks and context for client-side state

## Repository

- **Code Repository URL:** Private Repository
- **Version Control:** Git with standard-version for releases
- **Current Version:** 0.6.1
