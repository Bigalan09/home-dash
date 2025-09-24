# Recipe Feature Technical Specification

## Overview
Implementation of a recipe inspiration feature for the Home Dashboard that displays random meal ideas from a recipe API with minimal text and simple touch interactions.

## User Interface Design

### Recipe Page (recipes.html)
- Card-based layout with large recipe image at top
- Recipe title displayed prominently beneath image
- Key ingredients listed in bullet points (3-5 items)
- Cooking time and method icons (pan, oven, etc.)
- Dietary tags (Vegetarian, Quick, Budget)
- Swipe navigation between recipes
- Share button to send recipe URL to joint email
- Back button to return to main dashboard

### Visual Design
- Clean, uncluttered interface with ample white space
- Large, readable text for recipe titles and ingredients
- Visually distinct cooking method icons
- Consistent styling with existing dashboard theme
- Responsive design for 720x1280 portrait display

## Functionality

### Recipe Display
- Fetch 3-5 random recipes from API on page load
- Display one recipe at a time in card format
- Swipe left/right to navigate between recipes
- Tap to view cooking time and dietary information
- Share button to email recipe URL

### Recipe Selection
- Random recipes selected from API each visit
- Filter for UK-friendly recipes with metric measurements
- Vegetarian recipe options included
- Seasonal recipe suggestions when possible

## Technical Implementation

### API Integration
- Integration with free recipe API (e.g., Spoonacular, Edamam)
- Fetch random recipes with metric measurements
- Filter for vegetarian options
- Handle API rate limits and errors gracefully
- Cache recipe images for better performance

### Data Handling
- No local persistence of recipes
- New random recipes on each page visit
- Efficient image loading and caching
- Error handling for API failures

### Email Sharing
- Share button generates email with recipe URL
- Pre-populated subject line with recipe name
- Uses mailto: link for simplicity
- Fallback to copying URL if email client unavailable

## Integration Points
- Link from main dashboard Recipes button
- Consistent styling with existing dashboard theme
- Responsive design for 720x1280 portrait display
- Touch-optimized swipe navigation