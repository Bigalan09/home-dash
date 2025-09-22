# Mission Control Dashboard

A real-time home dashboard for Raspberry Pi Touch Display 2 featuring calendar events, task management, weather, and time in a futuristic mission control theme.

## Quick Start

```bash
# Setup
cp .env.example .env
# Add your API keys to .env
bun install

# Development
bun run dev

# Production (Docker)
docker-compose up -d
```

## Features

- Multi-source calendar (Todoist, Apple Calendar, UK Holidays)
- Interactive task completion
- Real-time weather with caching
- Touch-optimized for 720x1280 displays
- Event management (complete/dismiss)

## APIs Required

- **Todoist**: Task management
- **OpenWeather**: Weather data  
- **Apple Calendar**: iCloud calendar (optional)

See `CLAUDE.md` for complete setup instructions and documentation.