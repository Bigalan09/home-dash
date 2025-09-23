# Mission Control Dashboard

A sophisticated real-time home dashboard specifically designed for the **Raspberry Pi Touch Display 2** (720×1280 portrait). Features calendar integration, interactive task management, weather forecasting, and time display in a modern touch-optimised interface.

![Dashboard Preview](https://img.shields.io/badge/Platform-Raspberry%20Pi-red?logo=raspberry-pi) ![Theme](https://img.shields.io/badge/Theme-Modern%20Dark-e91e63) ![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## 🚀 Quick Start

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys (see Configuration section)

# 2. Install dependencies  
bun install

# 3. Development server (with hot reload)
bun run dev

# 4. Production deployment
docker-compose up -d
```

Access the dashboard at `http://localhost:3003` (or your configured port).

## ✨ Key Features

### 📅 Multi-Source Calendar Integration
- **Todoist Tasks** - Converted to calendar events with completion tracking
- **Apple Calendar** - iCloud calendar integration via webcal URL
- **UK Holidays** - Automatic public holiday calendar
- **Interactive Views** - Daily, weekly, and monthly calendar displays

### ✅ Smart Task Management
- **Real-time Sync** - Live Todoist API integration
- **Touch Completion** - Tap to complete tasks directly from dashboard
- **Priority Colour Coding** - Visual priority indicators
- **Overdue Highlighting** - Smart overdue task detection with day counts

### 🌤️ Advanced Weather System
- **Current Conditions** - Real-time weather with OpenWeather API
- **Interactive Forecasts** - Hourly and 5-day forecasts in modal view
- **Smart Caching** - 30-minute cache prevents API rate limits
- **Fallback Handling** - Graceful degradation when API unavailable

### 🎨 Triple Theme System
- **Modern Dark** (Active) - Sophisticated dark theme with pink accents
- **Modern Light** - Clean, minimal light theme
- **Futuristic** - Original space mission control aesthetic

### 📱 Touch Optimisation
- **Pi Display 2 Ready** - Optimised for 720×1280 portrait resolution
- **44px Minimum Targets** - All touch elements meet accessibility standards  
- **Gesture Support** - Touch-friendly interactions and animations
- **Activity Tracking** - Smart UI element visibility based on user interaction

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+
- **Backend**: Bun.js with TypeScript
- **Caching**: Redis with automatic in-memory fallback
- **Deployment**: Docker Compose with nginx reverse proxy
- **Testing**: Playwright integration tests + Bun test runner

### Core Components
```
├── index.html              # Touch-optimised HTML structure
├── modern-dark.css         # Active dark theme with pink accents  
├── modern-light.css        # Clean light theme option
├── futuristic.css         # Original space mission control theme
├── script.js              # Frontend application logic
├── server.ts              # Enhanced Bun server with Redis caching
└── docker-compose.yml     # Multi-container deployment config
```

## ⚙️ Configuration

### Required API Keys

Create `.env` file and add your API credentials:

```bash
# Todoist Integration (Required)
TODOIST_API_KEY=your_todoist_api_key_here
TODOIST_CALENDAR_URL=https://ext.todoist.com/export/ical/todoist?user_id=YOUR_ID&ical_token=YOUR_TOKEN

# Apple Calendar (Optional)
APPLE_CALENDAR_URL=webcal://p179-caldav.icloud.com/published/2/YOUR_CALENDAR_ID

# Weather Integration (Required)
OPENWEATHER_API_KEY=your_openweather_api_key_here
WEATHER_LAT=51.5074
WEATHER_LON=-0.1278

# Server Configuration
PORT=3003
REDIS_URL=redis://localhost:6379
```

### API Setup Instructions

**Todoist API**:
1. Visit [Todoist Integrations](https://todoist.com/prefs/integrations)
2. Copy your API token to `TODOIST_API_KEY`
3. Go to Settings → Integrations → Calendar feed
4. Copy the calendar URL to `TODOIST_CALENDAR_URL`

**Apple Calendar** (Optional):
1. Open Calendar.app on Mac
2. Right-click your calendar → Share Calendar
3. Make it public and copy the webcal:// URL

**OpenWeather**:
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Copy API key from dashboard (Free tier: 1,000 calls/day)
3. Get coordinates from [OpenWeather Find](https://openweathermap.org/find)

## 🐳 Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
# Start all services (nginx + Redis + API)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services  
docker-compose down
```

### Option 2: Direct Bun Server
```bash
# Development with hot reload
bun run dev

# Production
bun run start
```

### Option 3: Raspberry Pi Kiosk Mode
```bash
# Add to Pi autostart
@chromium-browser --kiosk --disable-infobars http://localhost:3003
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test suites
bun test tests/server.test.ts        # Server API tests
bun test tests/frontend.test.ts      # Frontend functionality
bun test tests/integration.test.ts   # Full integration tests
```

## 🔧 Development Commands

```bash
# Development server with hot reload
bun run dev

# Production server
bun run start  

# Docker operations
bun run docker:build    # Build containers
bun run docker:up       # Start services
bun run docker:down     # Stop services
bun run docker:logs     # View logs
```

## 📊 Performance Features

### Smart Caching System
- **Redis Primary** - Persistent cache across server restarts
- **Memory Fallback** - Automatic failover when Redis unavailable  
- **API Rate Limiting** - 30-minute weather cache prevents quota issues
- **Multi-endpoint Redundancy** - Fallback time servers for reliability

### Error Handling
- **Graceful Degradation** - Application continues when APIs fail
- **User Feedback** - Toast notifications for actions and errors
- **Fallback Data** - Local time and cached data when services unavailable
- **Retry Logic** - Automatic retry with exponential backoff

## 🎯 Raspberry Pi Optimisation

### Hardware Targeting
- **Resolution**: 720×1280 pixels (portrait orientation)
- **Touch**: Capacitive multi-touch with 5-point support
- **Interface**: DSI connector direct to Pi GPIO
- **Performance**: Optimised for Pi 4B with 4GB+ RAM

### Touch Interface Features
- **44px Minimum Targets** - Accessibility compliant touch zones
- **Visual Feedback** - Clear pressed states and animations  
- **Gesture Recognition** - Swipe and tap optimised interactions
- **Auto-hide Elements** - Smart UI that responds to user activity

## 🔍 Troubleshooting

### Common Issues

**Tasks not loading**:
```bash
# Verify Todoist API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.todoist.com/rest/v2/tasks
```

**Weather not updating**:
- Check OpenWeather API key validity
- Verify coordinates (WEATHER_LAT, WEATHER_LON)
- Review 30-minute cache timing

**Server connection issues**:
- Default port is 3003 (check server startup logs)
- Verify Redis connection or fallback to memory cache
- Check Docker container health status

### Log Analysis
```bash
# View server logs
docker-compose logs api

# Monitor API calls
docker-compose logs api | grep "Fetching"

# Check for errors
docker-compose logs api | grep -i error
```

## 📄 License

MIT License - see project files for details.

## 🔗 Related Documentation

- **[CLAUDE.md](CLAUDE.md)** - Comprehensive development guide and architecture
- **[CHANGELOG.md](CHANGELOG.md)** - Recent updates and theme documentation  
- **[Docker Compose](docker-compose.yml)** - Production deployment configuration

---

**Built for Raspberry Pi Touch Display 2** | **Production Ready** | **Touch Optimised**