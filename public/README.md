# Public Directory

This directory contains all frontend assets (HTML, CSS, JavaScript) that are served by nginx.

## Main Application Files
- `index.html` - Landing page with redirect
- `calendar.html` - Calendar view page
- `tasks.html` - Tasks view page
- `script.js` - Main application JavaScript

## Styles
- `modern-dark.css` - Modern dark theme (default)
- `modern-light.css` - Modern light theme
- `futuristic.css` - Original space theme

## Navigation
- `swipe-navigation.js` - 3-finger swipe navigation
- `swipe-navigation-mobile.js` - Mobile-optimized 2-finger swipe navigation

## Testing Files
- `test-swipe-manual.html` - Manual swipe testing
- `test-swipe-mobile.html` - Mobile swipe testing
- `test-swipe-navigation.js` - Navigation test utilities
- `verify-swipe-functionality.js` - Swipe verification utilities

## Usage
All files in this directory are automatically served by nginx when running Docker Compose.
Any new HTML, CSS, or JS files added here will be immediately accessible.