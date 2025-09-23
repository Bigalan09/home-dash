# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Mission Control Dashboard** - a sophisticated web application designed specifically for the **Raspberry Pi Touch Display 2** (720x1280 portrait, 7-inch capacitive touchscreen). The application provides a real-time dashboard displaying calendar events, tasks, weather, and time in a futuristic space mission control theme optimized for touch interaction.

### Key Achievements
- ✅ **Production-ready application** with real API integrations
- ✅ **Multi-source data aggregation** (Todoist, Apple Calendar, OpenWeather, UK Holidays)
- ✅ **Interactive task management** with completion functionality
- ✅ **Smart caching systems** for performance and API rate limiting
- ✅ **Robust error handling** with graceful fallbacks
- ✅ **Touch-optimized UI** specifically designed for Pi Touch Display 2
- ✅ **Dual theme system** with modern light and futuristic dark themes
- ✅ **Interactive weather forecast** with hourly and 5-day views

## Development Environment

Default to using Bun instead of Node.js for all JavaScript/TypeScript development:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`

## Project Architecture

### File Structure
```
/
├── index.html          # Landing page that redirects to calendar.html
├── calendar.html       # Calendar page with single-column layout (1st page)
├── tasks.html          # Tasks page with single-column layout (2nd page)
├── modern-dark.css     # Modern dark theme with pink accents (currently active)
├── modern-light.css    # Modern light theme - clean and minimal
├── futuristic.css      # Original dark futuristic theme with space aesthetics
├── script.js           # Application logic with touch event handling
├── server.ts           # Enhanced Bun server with Redis caching and fallback
├── server-redis.ts     # Backup of Redis-enabled server implementation
├── package.json        # Project dependencies and Bun scripts
├── .env.example        # Environment configuration template
├── CLAUDE.md          # This comprehensive documentation file
├── CHANGELOG.md        # Recent changes and theme documentation
├── README.md          # Quick start guide and overview
├── docker-compose.yml  # Docker deployment with Redis, nginx, and API
├── Dockerfile         # Container build configuration
├── nginx.conf         # Nginx configuration for static file serving
├── bun.lock           # Bun dependency lock file
└── tests/             # Test suites for server, frontend, and integration
    ├── server.test.ts
    ├── frontend.test.ts
    ├── integration.test.ts
    └── syntax.test.ts
```

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+ with separate page architecture
- **Backend**: Bun.js with TypeScript and Redis caching (with in-memory fallback)
- **APIs**: Todoist, Apple Calendar (iCloud), OpenWeatherMap, World Time API, UK Holidays
- **Deployment**: Docker Compose with nginx, Redis, and API containers
- **Testing**: Playwright for integration testing, Bun test runner
- **Target Hardware**: Raspberry Pi with 7" Touch Display 2 (720×1280 portrait)
- **Layout**: Single-column responsive layout optimised for separate calendar and task pages

### Core Architecture Patterns

**1. Modular Server Design** (`server.ts`):
- Environment-based configuration with fallbacks
- API proxy handlers with error handling
- Smart caching system (30-minute weather cache)
- Multi-endpoint redundancy (time API fallbacks)
- CORS handling for cross-origin requests
- RESTful POST endpoints for task/event actions

**2. Event-Driven Frontend** (`script.js`):
- MissionControlDashboard class as main controller
- Real-time clock with server time sync
- Touch-optimized interaction patterns
- Modal system for detailed views
- Responsive calendar views (daily/weekly/monthly)
- Graceful API failure handling
- Single-page architecture for focused user experience

**3. Multi-Page Navigation** (`index.html`, `calendar.html`, `tasks.html`):
- Landing page with automatic redirect to calendar
- Dedicated calendar page with full-screen calendar views
- Dedicated tasks page with focused task management
- Visual pagination indicators showing current page
- Single-column CSS grid layout for optimal Pi display usage

**4. Triple Theme System** (`modern-light.css` / `modern-dark.css` / `futuristic.css`):
- CSS Grid and Flexbox layouts
- Touch-friendly 44px minimum targets
- Animated background effects and transitions
- Priority-based color coding system
- Mobile-first responsive breakpoints
- CSS custom properties for consistent theming
- Modern light theme (default): Clean, Todoist-inspired design
- Futuristic dark theme: Original space mission control aesthetic

## API Integration Architecture

### Server Proxy Endpoints
```typescript
// Core Data Endpoints
GET  /api/tasks                // Todoist tasks via REST API
GET  /api/calendar             // Multi-source calendar aggregation
GET  /api/weather              // OpenWeather current with 30-min caching
GET  /api/weather/forecast     // OpenWeather forecast (hourly + 5-day)
GET  /api/time                // World Time API with fallbacks

// Action Endpoints
POST /api/tasks/complete       // Complete Todoist tasks
POST /api/events/action        // Complete/dismiss calendar events
```

### Multi-Source Calendar Integration
The application aggregates calendar data from three sources:
1. **Todoist** - Tasks converted to calendar events via ICS export
2. **Apple Calendar** - iCloud calendar via webcal:// URL
3. **UK Holidays** - Government holiday calendar

**Data Flow**:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Todoist ICS   │────┤                  │    │                 │
├─────────────────┤    │  Calendar        │────┤  Filtered &     │
│ Apple Calendar  │────┤  Aggregator      │    │  Sorted Events  │
├─────────────────┤    │  (server.ts)     │    │                 │
│  UK Holidays    │────┤                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Smart Caching & Performance
- **Weather Caching**: 30-minute cache to stay within API limits
- **Time Sync**: 5-minute server sync with local fallback
- **Error Recovery**: Multi-endpoint fallback for time API
- **Rate Limiting**: Built-in request throttling

## Task & Event Management System

### Task Completion Workflow
```
User Clicks Task → Task Modal Opens → Complete Button → API Call → Todoist Update → UI Refresh
```

**Implementation Details**:
```javascript
// Task completion flow
async function completeTask(taskId, buttonElement) {
  // 1. Update UI state (disable button, show loading)
  // 2. POST to /api/tasks/complete with taskId
  // 3. Handle Todoist API response
  // 4. Close modal and refresh task list
  // 5. Error handling with user feedback
}
```

### Event Management Workflow
```
User Clicks Event → Event Modal Opens → Action Buttons → In-Memory Tracking → UI Filtering
```

**Actions Available**:
- **Complete**: Mark event as completed (removes from view)
- **Dismiss**: Dismiss event without completion (removes from view)

## Environment Configuration

### Required API Keys & URLs

Create `.env` file from `.env.example`:

```bash
# Todoist Integration (Required for tasks)
TODOIST_API_KEY=your_actual_todoist_api_key
TODOIST_BASE_URL=https://api.todoist.com/rest/v2
TODOIST_CALENDAR_URL=https://ext.todoist.com/export/ical/todoist?user_id=YOUR_USER_ID&ical_token=YOUR_TOKEN

# Apple Calendar Integration (Optional)
APPLE_CALENDAR_URL=webcal://p179-caldav.icloud.com/published/2/YOUR_CALENDAR_ID

# UK Holidays (Auto-configured)
UK_HOLIDAYS_CALENDAR_URL=https://www.gov.uk/bank-holidays/england-and-wales.ics

# Weather Integration (Required for weather display)
OPENWEATHER_API_KEY=your_openweather_api_key
WEATHER_LAT=51.5074    # Your latitude
WEATHER_LON=-0.1278    # Your longitude
WEATHER_UNITS=metric
WEATHER_EXCLUDE=minutely

# Time Server (Multiple fallback endpoints)
TIME_API_URL=https://worldtimeapi.org/api/timezone/Europe/London

# Server Configuration
PORT=3000
```

### API Setup Instructions

**1. Todoist API Setup**:
```bash
# 1. Visit: https://todoist.com/prefs/integrations
# 2. Copy your API token
# 3. For calendar URL: Go to Settings → Integrations → Calendar feed
# 4. Copy the calendar URL (includes user_id and ical_token)
```

**2. Apple Calendar Setup**:
```bash
# 1. Open Calendar.app on Mac
# 2. Right-click your calendar → Share Calendar
# 3. Make it public and copy the URL
# 4. URL format: webcal://p179-caldav.icloud.com/published/2/...
```

**3. OpenWeather Setup**:
```bash
# 1. Sign up at: https://openweathermap.org/api
# 2. Free tier: 1,000 calls/day, 60 calls/hour
# 3. Copy API key from dashboard
# 4. Get coordinates: https://openweathermap.org/find
```

## Development Commands

### Quick Start
```bash
# Initial setup
cp .env.example .env
# Edit .env with your API keys
bun install

# Development with hot reload
bun run dev
# Starts server at http://localhost:3000 (or PORT from .env)

# Production
bun run start
```

### Docker Deployment
```bash
# Using Docker (recommended for Pi)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### NPM Scripts
```json
{
  "dev": "bun --hot server.ts",           // Development with hot reload
  "start": "bun server.ts",               // Production server
  "docker:build": "docker-compose build", // Build Docker images
  "docker:up": "docker-compose up -d",    // Start Docker services
  "docker:down": "docker-compose down",   // Stop Docker services
  "docker:logs": "docker-compose logs -f" // View Docker logs
}
```

## Pi Touch Display 2 Optimizations

### Hardware Specifications
- **Resolution**: 720×1280 pixels (portrait)
- **Size**: 7-inch diagonal
- **Touch**: Capacitive multi-touch (5 simultaneous points)
- **Interface**: DSI connector
- **Power**: Direct from Raspberry Pi GPIO

### Page Architecture for Pi Display
- **Single-Column Layout**: Full utilisation of 720px width with single-column grid
- **Dedicated Pages**: Separate calendar.html and tasks.html for focused interactions
- **Navigation**: Pagination dots indicate current page (1st = calendar, 2nd = tasks)
- **Optimised Touch Targets**: All interactive elements exceed 44px minimum size

### Touch Interface Optimizations
```css
/* Pi-specific optimizations in theme CSS files */
body {
  max-width: 720px;
  max-height: 1280px;
  touch-action: manipulation;
  user-select: none;
}

/* Single-column grid layout */
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
}

/* Touch-friendly button sizes (44px minimum) */
.system-btn, .view-btn, .action-btn {
  min-height: 44px;
  min-width: 44px;
}

/* Touch feedback animations */
.todo-item:active, .calendar-day:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
```

### Performance Considerations
- **Efficient DOM Updates**: Minimal re-rendering
- **Hardware Acceleration**: CSS transform animations
- **Memory Management**: Smart caching and cleanup
- **Touch Responsiveness**: Passive event listeners

## Theme System

### Triple Theme Architecture
The application now supports three distinct themes with seamless switching:

**Modern Dark Theme** (`modern-dark.css`) - **Currently Active**:
```css
/* CSS Custom Properties */
:root {
  --bg: #0f0f0f;                /* Deep dark background */
  --text: #f8f9fa;              /* Light text for contrast */
  --accent: #e91e63;            /* Vibrant pink accent */
  --border: #2a2a2a;            /* Subtle dark borders */
  --focus: #e91e63;             /* Pink focus states */
}
```

**Modern Light Theme** (`modern-light.css`):
```css
/* CSS Custom Properties */
:root {
  --bg: #ffffff;                  /* Clean white background */
  --text: #1f2328;               /* High contrast dark text */
  --accent: #db4c3f;             /* Warm red accent (Todoist-like) */
  --border: #e5e7eb;             /* Subtle grey borders */
  --focus: #2563eb;              /* Accessible blue focus */
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06); /* Subtle shadows */
}
```

**Futuristic Dark Theme** (`futuristic.css`) - **Original Space Theme**:
```css
/* Original space mission control aesthetic */
:root {
  --bg-primary: #0a0a0a;         /* Deep space black */
  --primary-cyan: #00d4ff;       /* Cyan accents and glows */
  --primary-green: #00ffaa;      /* Success indicators */
  --text-primary: #e8f4fd;      /* Light blue-white text */
}
```

### Theme Switching
To switch themes, modify the stylesheet link in `index.html`:
```html
<!-- Modern Dark Theme (currently active) -->
<link rel="stylesheet" href="modern-dark.css" />

<!-- Modern Light Theme -->
<link rel="stylesheet" href="modern-light.css" />

<!-- Futuristic Dark Theme -->
<link rel="stylesheet" href="futuristic.css" />
```

### Accessibility Compliance
- **WCAG AA compliant**: All themes maintain contrast ratios exceeding 4.5:1 for normal text
- **Focus indicators**: Clear, accessible outline styles across all themes
- **Touch targets**: Minimum 44px for all interactive elements
- **Color independence**: Information conveyed through multiple visual cues
- **Theme consistency**: Semantic colour tokens ensure consistent UX across themes

## Design System

### Color Palette (Modern Dark Theme - Active)
```css
/* Primary Colors */
--accent: #e91e63           /* Primary pink accent */
--success: #10b981          /* Success/complete states */
--warning: #f59e0b          /* Medium priority */
--danger: #ef4444           /* High priority */
--info: #6b7280             /* Low priority/muted */

/* Background & Layout */
--bg: #0f0f0f               /* Main dark background */
--bg-elev: #1a1a1a          /* Elevated surfaces */
--text: #f8f9fa             /* Primary text */
--text-muted: #9ca3af       /* Secondary text */
--border: #2a2a2a           /* Subtle borders */
```

### Typography
```css
/* Font Families */
font-family: "Inter", -apple-system, sans-serif;     /* Body text */
font-family: "Poppins", "Inter", sans-serif;         /* Headers */

/* Font Weights */
font-weight: 300;  /* Light */
font-weight: 400;  /* Regular */
font-weight: 500;  /* Medium */
font-weight: 600;  /* Semi-bold */
font-weight: 700;  /* Bold */
```

### Animation System
```css
/* Modern subtle animations */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Touch feedback */
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

## Data Structures & APIs

### Event Object Schema
```typescript
interface Event {
  id: string;                    // Unique identifier
  title: string;                 // Event title
  date: string;                  // YYYY-MM-DD format
  time: string;                  // HH:MM format
  duration: string;              // "X hours" format
  description: string;           // Event description
  location: string;              // Event location
  priority: 'high'|'medium'|'low'; // Priority level
  source: string;                // Data source name
  attendees?: string[];          // Optional attendees
}
```

### Task Object Schema
```typescript
interface Task {
  id: string;                    // Todoist task ID
  title: string;                 // Task title
  project: string;               // Mapped project name
  priority: 1|2|3|4;            // 1=highest, 4=lowest
  due: string;                   // ISO date string
  description: string;           // Task description
  assignee: string;              // Assigned person
  status: 'pending'|'in-progress'|'completed'|'planning';
  completion: number;            // 0-100 percentage
}
```

### API Response Formats
```typescript
// Calendar API Response
{
  events: Event[];
  total_events: number;
  filtered_events: number;
  completed_count: number;
  dismissed_count: number;
  sources: Array<{name: string, configured: boolean}>;
}

// Weather API Response (with caching)
{
  current: {
    temp: number;
    weather: Array<{main: string, description: string, icon: string}>;
  };
  cached: boolean;
  cache_age_minutes?: number;
  api_version: "2.5" | "3.0";
}
```

## Key Features & Implementation

### 1. Real-Time Clock & Time Sync
```javascript
// Server time synchronization every 5 minutes
async syncTimeWithServer() {
  const response = await fetch('/api/time');
  const timeData = await response.json();
  this.serverTimeOffset = new Date(timeData.datetime).getTime() - Date.now();
}

// Display updates every second
updateDateTime() {
  const now = this.serverTimeOffset 
    ? new Date(Date.now() + this.serverTimeOffset)
    : new Date();
}
```

### 2. Multi-View Calendar System
- **Daily View**: Today's events in chronological order
- **Weekly View**: 7-day grid with event previews
- **Monthly View**: Full month grid with event dots

### 3. Interactive Task Management
```javascript
// Task completion with API integration
async completeTask(taskId, buttonElement) {
  const response = await fetch('/api/tasks/complete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({taskId})
  });
  
  if (response.ok) {
    closeModal('taskModal');
    this.loadTasks(); // Refresh task list
  }
}
```

### 4. Smart Weather Caching
```typescript
// 30-minute cache with API fallback
if (weatherCache && now - weatherCache.timestamp < WEATHER_CACHE_DURATION) {
  return cachedResponse;
}

// Try One Call 3.0, fallback to 2.5 if subscription required
let response = await fetch(oneCall3URL);
if (!response.ok && data.message?.includes('One Call 3.0')) {
  response = await fetch(standardWeatherURL);
}
```

### 5. Interactive Weather Forecast Modal
```javascript
// Weather modal with hourly and 5-day forecast
window.showWeatherDetails = function() {
  if (!dashboard || !dashboard.weatherForecast) {
    console.warn("Weather forecast data not available");
    return;
  }

  const modal = document.getElementById("weatherModal");
  modal.classList.add("active");
  dashboard.renderWeatherForecast();
}

// View switching between hourly and daily forecasts
window.switchWeatherView = function(view) {
  dashboard.currentWeatherView = view;
  dashboard.renderWeatherForecast();
}
```

**Features**:
- **Hourly Forecast**: Next 24 hours with temperature, weather, humidity, wind
- **5-Day Forecast**: Daily highs/lows, weather conditions, and detailed metrics
- **Interactive UI**: Touch-friendly view switching between hourly and daily
- **Smart Caching**: 30-minute cache prevents API rate limit issues
- **Fallback Handling**: Graceful degradation when API unavailable

### 6. Touch Activity Tracking
```javascript
// Show/hide pagination based on user activity
setupActivityTracking() {
  const trackActivity = () => {
    this.lastActivity = Date.now();
    document.getElementById('pagination').classList.add('visible');

    setTimeout(() => {
      if (Date.now() - this.lastActivity >= 6000) {
        pagination.classList.remove('visible');
      }
    }, 6000);
  };
}
```

## Error Handling & Fallbacks

### API Error Recovery
```typescript
// Multi-endpoint fallback (Time API)
const timeEndpoints = [
  'https://worldtimeapi.org/api/timezone/Europe/London',
  env.TIME_API_URL
];

for (const endpoint of timeEndpoints) {
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(8000)
    });
    return response; // Success
  } catch (error) {
    console.error(`Endpoint failed: ${endpoint}`);
    // Try next endpoint
  }
}

// Return local time as final fallback
return {
  datetime: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  fallback: true
};
```

### Weather API Fallback
```typescript
// Smart fallback from One Call 3.0 to 2.5
if (!response.ok && data.message?.includes('One Call 3.0')) {
  console.log('Falling back to standard weather API');
  response = await fetch(standardWeatherURL);
}
```

### Frontend Error Handling
```javascript
// Graceful degradation for API failures
async loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    const data = await response.json();
    
    if (data.error) {
      console.warn('Tasks API not configured:', data.error);
      this.tasks = []; // Empty state
      return;
    }
    
    this.tasks = this.processTaskData(data);
  } catch (error) {
    console.error('Failed to load tasks:', error);
    this.tasks = []; // Graceful fallback
  }
}
```

## Extending the Application

### Adding New API Integrations
1. **Add environment variables** to `.env.example` and `.env`
2. **Create handler function** in `server.ts`:
   ```typescript
   async function handleNewAPI(req: Request): Promise<Response> {
     // Implementation
   }
   ```
3. **Add route** to server fetch handler
4. **Update frontend** API configuration
5. **Add error handling** and fallbacks

### Adding New Calendar Views
1. **Create view function** in `script.js`:
   ```javascript
   renderCustomView() {
     // Implementation
   }
   ```
2. **Add view button** to HTML
3. **Update view switching** logic
4. **Add CSS styles** for new view

### Modifying Task/Event Actions
1. **Add new action** to event handler:
   ```typescript
   if (action === 'newAction') {
     // Handle new action
   }
   ```
2. **Update frontend** action buttons
3. **Add UI feedback** and error handling

## Deployment Options

### Option 1: Direct Bun Server
```bash
# Development
bun run dev

# Production
bun run start
```

### Option 2: Docker with nginx
```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "${WEB_PORT:-3000}:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - .:/usr/share/nginx/html
  
  api:
    build: .
    environment:
      - NODE_ENV=production
    volumes:
      - ./.env:/app/.env
```

### Option 3: Raspberry Pi Kiosk Mode
```bash
# Auto-start browser in kiosk mode
@chromium-browser --kiosk --disable-infobars http://localhost:3000
```

## Performance Monitoring

### Key Metrics to Monitor
- **API Response Times**: Each endpoint latency
- **Cache Hit Rates**: Weather and time caching efficiency
- **Error Rates**: Failed API calls by endpoint
- **Memory Usage**: Frontend and server memory consumption
- **Touch Responsiveness**: UI interaction delays

### Debugging Tools
```bash
# View real-time logs
docker-compose logs -f

# Monitor API health
curl http://localhost:3000/api/time
curl http://localhost:3000/api/weather

# Check server status
curl -I http://localhost:3000
```

## Security Considerations

### API Key Protection
- All API keys stored in `.env` (not committed to repo)
- Server-side proxy prevents client-side key exposure
- CORS properly configured for cross-origin requests

### Input Validation
```typescript
// Server-side validation for task completion
const { taskId } = body;
if (!taskId || typeof taskId !== 'string') {
  return new Response(JSON.stringify({error: 'Invalid task ID'}), {
    status: 400
  });
}
```

### Rate Limiting
- Weather API: 30-minute caching prevents rate limit hits
- Time API: Multiple endpoints prevent single point of failure
- Built-in request timeouts prevent hanging requests

## Troubleshooting Guide

### Common Issues

**1. Tasks not loading**:
```bash
# Check Todoist API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.todoist.com/rest/v2/tasks

# Verify environment variables
echo $TODOIST_API_KEY
```

**2. Calendar events missing**:
- Verify Apple Calendar URL is public and accessible
- Check Todoist calendar URL includes correct user_id and token
- Confirm UK Holidays URL is reachable

**3. Weather not updating**:
- Verify OpenWeather API key is valid
- Check coordinates are correct (WEATHER_LAT, WEATHER_LON)
- Review cache timing (30-minute cache duration)

**4. Time sync issues**:
- Multiple endpoints provide redundancy
- Falls back to local time if all endpoints fail
- Check console for endpoint failure messages

### Log Analysis
```bash
# View server startup logs
docker-compose logs api | grep "Mission Control Dashboard running"

# Monitor API calls
docker-compose logs api | grep "Fetching"

# Check error patterns
docker-compose logs api | grep -i error
```

## Recent Updates & Improvements

### Multi-Page Architecture (September 2025)
- **Separate Pages**: Split calendar and tasks into dedicated pages (calendar.html, tasks.html)
- **Single-Column Layout**: Optimised CSS grid for full-screen single-column experience
- **Navigation System**: Visual pagination indicators for current page identification
- **Focused User Experience**: Dedicated interfaces for calendar and task management
- **Production Ready**: All pages tested and optimised for Pi Touch Display 2

### Enhanced Theme System (September 2025)
- **Triple Theme Support**: Modern dark (active), modern light, and futuristic themes
- **Modern Dark Theme**: New sophisticated dark theme with vibrant pink accents
- **CSS Custom Properties**: Comprehensive semantic colour tokens for consistent theming
- **Accessibility Compliance**: Ensured WCAG AA compliance across all themes
- **Layout Preservation**: Single-column layout maintained across all themes
- **Production Ready**: All themes fully tested and optimised for Pi Touch Display 2

### Weather Modal Enhancement (September 2025)
- **Bug Fix**: Resolved weather modal not opening issue
- **Robust Error Handling**: Added dashboard initialization checks
- **Interactive Forecast**: Enhanced modal with hourly and 5-day weather views
- **Touch Optimization**: Improved button sizing and interaction feedback
- **API Integration**: Full OpenWeather One Call API integration with fallback support

### Modern UI Improvements (September 2025)
- **Active Dark Theme**: Currently using modern dark theme with pink (#e91e63) accents
- **Typography Upgrade**: Inter and Poppins fonts for improved readability
- **Refined Animations**: Clean, subtle animations optimised for touch interaction
- **Toast Notifications**: Success/error toast system for user feedback
- **Enhanced Interactions**: All interactive elements with clear pressed states
- **Smart Task Management**: Overdue task highlighting with dynamic button text
- **Touch Optimisation**: All elements exceed 44px minimum touch targets

### Development Workflow & Infrastructure
- **Hot Reload**: Bun development server with automatic reloading via `bun run dev`
- **Multi-Page Serving**: Server handles calendar.html, tasks.html, and index.html routing
- **Redis Caching**: Enhanced caching with automatic in-memory fallback when Redis unavailable
- **Docker Deployment**: Multi-container setup with nginx, Redis, and API services including new HTML files
- **Test Suite**: Comprehensive testing with Playwright for integration tests
- **Error Recovery**: Robust fallback systems for all external APIs
- **Performance Monitoring**: Built-in logging and cache efficiency tracking
- **Touch Testing**: Optimised for Pi Touch Display 2 with verified 44px minimum targets

### Documentation
- **Comprehensive Guides**: Complete setup, API configuration, and troubleshooting
- **Code Examples**: Real implementation patterns and best practices  
- **Deployment Options**: Docker Compose, direct Bun server, and Pi kiosk mode instructions
- **Architecture Documentation**: Detailed server structure, caching strategy, and API integration patterns
- **Theme Documentation**: Complete guide to theme system and customisation
- **Extensibility**: Clear patterns for adding new features and API integrations

This comprehensive documentation provides everything needed to understand, maintain, and extend the Mission Control Dashboard. The application is production-ready with robust error handling, Redis caching with in-memory fallback, multi-page architecture optimised for the Raspberry Pi Touch Display 2, and features a sophisticated triple-theme system with enhanced weather forecasting capabilities and comprehensive test coverage.