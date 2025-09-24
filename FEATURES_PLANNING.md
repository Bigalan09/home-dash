# Features Planning: Timers and Recipe Inspiration

This document outlines the completed planning for implementing two new features for the Home Dashboard: Timers/Countdowns and Recipe Inspiration.

## 1. Timers and Countdowns

### Feature Overview
A visual timer system that allows family members to set and monitor a single timer using simple touch interactions. The timer is displayed full-screen and remains visible until manually dismissed.

### Display Requirements
- Full-screen timer display that fills up from the bottom of the page to the top
- Clear time remaining display (e.g., "07:30")
- Visual progress bar filling up as time passes
- Only one timer/countdown at a time
- Timer remains visible once countdown is complete until dismissed

### Interaction Design
- **Preset Buttons**: Quick access to common timer durations (5, 10, 20, 30 minutes)
- **Tap Timer**: Pause/resume functionality
- **Dismiss Button**: Return to normal dashboard after timer completion
- **Restart Button**: Reset and start timer again

### Technical Considerations
- Persistent storage for active timer (survive page refresh/reboot)
- Visual notification (flashing) when timer completes
- No audio notifications (display has no speaker)
- Simple preset durations only (no custom durations)
- Return to dashboard functionality after timer dismissal

## 2. Recipe Inspiration

### Feature Overview
A visual recipe suggestion system that displays meal ideas with minimal text, helping to break the "what's for tea?" cycle. Recipes are randomly selected from an API each time the page is visited.

### Display Requirements
- Card-style layout with:
  - Large image of the dish at the top
  - Recipe name beneath the image
  - 3-5 key ingredients listed
  - Cooking method icons (pan, oven, salad bowl)
- Swipe left/right navigation between recipes
- Dietary tags (Vegetarian, Quick, Budget, etc.)

### Interaction Design
- **Tap**: View recipe details and cooking time
- **Swipe Left/Right**: Navigate between different recipe suggestions
- **Share Button**: Send recipe URL to joint email address
- **Back Button**: Return to dashboard
- **Refresh Button**: Get new random recipes

### Content Requirements
- Integration with a free recipe API offering metric and vegetarian recipes
- UK-specific recipe considerations (ingredients, measurements, meal times)
- Seasonal recipe suggestions

### Technical Considerations
- Integration with free recipe API offering metric and vegetarian recipes
- Image optimisation for quick loading
- No persistence - random recipes each visit
- No filtering system needed
- Random recipe selection from API

## Implementation Status
Planning for both features is complete. Detailed technical specifications have been created in separate documents:
- Timer Feature Technical Specification (TIMER_SPEC.md)
- Recipe Feature Technical Specification (RECIPE_SPEC.md)
- Implementation Plan (IMPLEMENTATION_PLAN.md)

The implementation can now proceed with development of both features.