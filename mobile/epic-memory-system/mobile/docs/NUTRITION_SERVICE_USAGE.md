# Nutrition Service Usage Guide

## Overview

The updated NutritionService provides robust nutrition data with automatic fallback from USDA API to a comprehensive local database containing 35+ common foods.

## Key Features

- **🔄 Automatic Fallback**: Tries USDA API first, falls back to local database
- **📊 Comprehensive Data**: 35+ foods with complete nutrition profiles
- **🔍 Smart Search**: Search by name, brand, or category
- **💾 Caching**: Intelligent caching for performance
- **🛡️ Error Handling**: Graceful handling of API failures

## Quick Start

```javascript
import { nutritionService } from './services/NutritionService';

// Basic search (will use local database if no API key)
const results = await nutritionService.searchFoods('chicken');
console.log(`Found ${results.foods.length} foods`);

// Set API key for USDA access (optional)
nutritionService.setApiKey('YOUR_USDA_API_KEY');

// Get detailed food information
const foodDetails = await nutritionService.getFoodDetails(results.foods[0].fdcId);
```

## API Configuration

### Option 1: No API Key (Local Only)
```javascript
// Service will automatically use local database
const results = await nutritionService.searchFoods('banana');
// Returns local database results
```

### Option 2: With USDA API Key
```javascript
// Get API key from https://fdc.nal.usda.gov/api-key-signup.html
nutritionService.setApiKey('YOUR_API_KEY_HERE');

// Service will try USDA API first, fallback to local if needed
const results = await nutritionService.searchFoods('apple');
```

## Local Database Foods

The service includes 35+ common foods across all major categories:

### Proteins (6 foods)
- Chicken Breast (raw & cooked)
- Ground Beef (90% lean)
- Atlantic Salmon
- Eggs (whole)
- Tofu (firm)

### Carbohydrates (8 foods)
- Brown Rice (cooked)
- White Rice (cooked)
- Quinoa (cooked)
- Rolled Oats (dry)
- Sweet Potato (baked)
- Russet Potato (baked)
- Whole Wheat Bread
- Whole Wheat Pasta (cooked)

### Fruits (6 foods)
- Apple (with skin)
- Banana (raw)
- Orange (raw)
- Blueberries (raw)
- Strawberries (raw)
- Avocado (raw)

### Vegetables (5 foods)
- Broccoli (raw)
- Spinach (raw)
- Carrots (raw)
- Tomatoes (raw)
- Red Bell Pepper

### Dairy (3 foods)
- Whole Milk
- Greek Yogurt (plain)
- Cheddar Cheese

### Nuts & Seeds (3 foods)
- Almonds (raw)
- Walnuts (raw)
- Peanut Butter (smooth)

### Legumes (3 foods)
- Black Beans (cooked)
- Chickpeas (cooked)
- Lentils (cooked)

### Plus: Oils, beverages, and common snacks

## Usage Examples

### 1. Basic Food Search
```javascript
// Search local database
const results = await nutritionService.searchFoods('chicken');

results.foods.forEach(food => {
  console.log(`${food.description}: ${food.calories.value} cal`);
});
```

### 2. Category Filtering
```javascript
// Search within specific category
const fruits = await nutritionService.searchFoods('', {
  category: 'Fruits and Fruit Juices'
});
```

### 3. Get Food Details
```javascript
// Get detailed nutrition info
const chicken = await nutritionService.getFoodDetails('chicken-breast-raw');
console.log('Detailed nutrition:', chicken.vitaminA, chicken.iron);
```

### 4. Calculate Macros
```javascript
const food = await nutritionService.getFoodDetails('banana-raw');
const macros = nutritionService.calculateMacroPercentages(food);
console.log(`Macros: ${macros.protein}% protein, ${macros.carbs}% carbs, ${macros.fat}% fat`);
```

### 5. Get Popular Foods
```javascript
const popular = nutritionService.getPopularFoods();
console.log('Popular foods:', popular);
// ['chicken breast', 'salmon', 'eggs', 'greek yogurt', ...]
```

### 6. Get Food Categories
```javascript
const categories = nutritionService.getFoodCategories();
console.log('Available categories:', categories);
```

### 7. Service Statistics
```javascript
const stats = nutritionService.getStats();
console.log('Database stats:', stats);
// {
//   localFoodsCount: 35,
//   localCategories: 12,
//   hasApiKey: false,
//   searchPreference: 'API first',
//   cacheSize: 5,
//   searchHistoryCount: 10
// }
```

## Error Handling

The service gracefully handles various error scenarios:

```javascript
try {
  const results = await nutritionService.searchFoods('pizza');
} catch (error) {
  // Service automatically falls back to local database
  console.log('Search completed with local data');
}
```

## Performance Features

### Caching
- Automatic result caching (30 minutes)
- Smart cache management (max 100 items)
- Cache clearing available

### Search History
- Tracks recent searches
- Provides search suggestions
- Improves user experience

### Background Fallback
- Transparent API failures
- No user interruption
- Consistent data format

## Common Use Cases

### 1. Nutrition Tracking App
```javascript
// Search and select foods
const results = await nutritionService.searchFoods(userQuery);
const selectedFood = results.foods[0];

// Calculate nutrition for serving size
const servingCalories = selectedFood.calories.value * (servingGrams / 100);
```

### 2. Recipe Nutrition Calculator
```javascript
// Get nutrition for multiple ingredients
const ingredients = ['chicken-breast-raw', 'rice-brown-cooked', 'broccoli-raw'];
const nutritionData = await nutritionService.getFoodsByIds(ingredients);

// Sum total nutrition
const totalCalories = nutritionData.reduce((sum, food) => 
  sum + (food.calories.value * quantity), 0
);
```

### 3. Dietary Analysis
```javascript
// Analyze macro balance
const food = await nutritionService.getFoodDetails('almonds-raw');
const macros = nutritionService.calculateMacroPercentages(food);

if (macros.protein > 20) {
  console.log('High protein food');
}
```

## Testing

Run the included test file to verify functionality:

```bash
node test-nutrition.js
```

This will test:
- Local database search
- Nutrition calculations  
- API fallback handling
- Data transformation

## Troubleshooting

### No Results Found
- Check spelling in search query
- Try broader terms (e.g., "chicken" instead of "chicken breast")
- Use category filtering to narrow results

### API Errors
- Verify API key is correct
- Check USDA API status
- Service will automatically use local database as fallback

### Performance Issues
- Clear cache if needed: `nutritionService.clearCache()`
- Check cache size: `nutritionService.getStats()`
- Consider reducing search frequency

## USDA API Key Setup

1. Visit: https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up for free API key
3. Add to your app:
   ```javascript
   nutritionService.setApiKey('YOUR_API_KEY');
   ```

Note: The service works perfectly without an API key using the local database.