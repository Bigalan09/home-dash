# Timer Feature Technical Specification

## Overview
Implementation of a full-screen timer feature for the Home Dashboard that allows family members to set and monitor a single timer using simple touch interactions.

## User Interface Design

### Timer Page (timer.html)
- Full-screen display with progress visualization filling from bottom to top
- Large, clear time display in the center (HH:MM:SS format)
- Preset duration buttons: 5 min, 10 min, 20 min, 30 min
- Control buttons: Start/Pause, Restart, Dismiss
- Visual progress bar that fills as time passes
- Return to dashboard button (Dismiss)

### Visual Design
- Progress bar fills from bottom (0%) to top (100%) of screen
- Time display uses large, high-contrast text
- Active timer state clearly distinguishable from setup state
- Completed timer state with visual indication

## Functionality

### Timer States
1. **Setup**: User selects duration and configures timer
2. **Running**: Timer is actively counting down
3. **Paused**: Timer is paused but not reset
4. **Completed**: Timer has reached zero and is visible until dismissed

### Controls
- **Preset Buttons**: One-tap selection of common durations
- **Start/Pause Button**: Toggles between running and paused states
- **Restart Button**: Resets timer to initial duration and starts again
- **Dismiss Button**: Clears timer and returns to dashboard

## Technical Implementation

### Storage
- Use localStorage to persist active timer state
- Store: duration, remaining time, state (running/paused), start time
- Restore timer state on page load if active

### Timer Logic
- Use JavaScript setInterval for accurate timing
- Calculate remaining time based on start time and duration
- Handle page refreshes by recalculating elapsed time
- Visual updates every 100ms for smooth progress bar animation

### Return to Dashboard
- Dismiss button clears timer state from localStorage
- Redirect user to index.html (main dashboard)
- Ensure clean state transition

## Integration Points
- Link from main dashboard Timers button
- Consistent styling with existing dashboard theme
- Responsive design for 720x1280 portrait display