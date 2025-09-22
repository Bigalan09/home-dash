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
├── index.html          # Clean HTML structure optimized for Pi Touch Display 2
├── styles.css          # Comprehensive CSS with Pi-specific optimizations
├── script.js           # Application logic with touch event handling
├── server.ts           # Bun server with API proxies and caching
├── package.json        # Project dependencies and npm scripts
├── .env.example        # Environment configuration template
├── CLAUDE.md          # This documentation file
└── docker-compose.yml  # Docker deployment configuration
```

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+
- **Backend**: Bun.js with TypeScript
- **APIs**: Todoist, Apple Calendar (iCloud), OpenWeatherMap, World Time API
- **Deployment**: Docker with nginx reverse proxy
- **Target Hardware**: Raspberry Pi with 7" Touch Display 2

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

**3. Responsive Design System** (`styles.css`):
- CSS Grid and Flexbox layouts
- Touch-friendly 44px minimum targets
- Animated background effects and transitions
- Priority-based color coding system
- Mobile-first responsive breakpoints

## API Integration Architecture

### Server Proxy Endpoints
```typescript
// Core Data Endpoints
GET  /api/tasks           // Todoist tasks via REST API
GET  /api/calendar        // Multi-source calendar aggregation
GET  /api/weather         // OpenWeather with 30-min caching
GET  /api/time           // World Time API with fallbacks

// Action Endpoints
POST /api/tasks/complete  // Complete Todoist tasks
POST /api/events/action   // Complete/dismiss calendar events
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
# Starts server at http://localhost:3000

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

### Touch Interface Optimizations
```css
/* Pi-specific optimizations in styles.css */
body {
  max-width: 720px;
  max-height: 1280px;
  touch-action: manipulation;
  user-select: none;
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

## Design System

### Color Palette
```css
/* Primary Colors */
--primary-cyan: #00d4ff      /* Primary accent */
--primary-green: #00ffaa     /* Success/complete */
--warning: #ffa502          /* Medium priority */
--danger: #ff4757           /* High priority */
--info: #747d8c             /* Low priority */

/* Background & Layout */
--bg-primary: #0a0a0a       /* Main background */
--bg-secondary: #000000     /* Deep black */
--text-primary: #e8f4fd     /* Main text */
--border: rgba(0, 149, 255, 0.2)  /* Borders */
```

### Typography
```css
/* Font Families */
font-family: "Space Grotesk", monospace;  /* Body text */
font-family: "Orbitron", monospace;       /* Headers */

/* Font Weights */
font-weight: 300;  /* Light */
font-weight: 400;  /* Regular */
font-weight: 500;  /* Medium */
font-weight: 700;  /* Bold */
```

### Animation System
```css
/* Background grid animation */
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}

/* Scanning effect */
@keyframes scan {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100vw); }
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

### 5. Touch Activity Tracking
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
1. **Add environment variables** to `.env.example`
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

This comprehensive documentation provides everything needed to understand, maintain, and extend the Mission Control Dashboard. The application is production-ready with robust error handling, smart caching, and optimized performance for the Raspberry Pi Touch Display 2.