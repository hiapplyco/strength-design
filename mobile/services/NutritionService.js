/**
 * Nutrition Service
 * Integrates with USDA FoodData Central API for comprehensive food database access
 * 
 * API Integration:
 * - Base URL: https://api.nal.usda.gov/fdc/v1/
 * - Search endpoint: /foods/search (GET request with query parameters)
 * - API Key: fOPqaxXTfIhxp0NYDqQaCa2KHU0Ch9b8dIzJUTnY
 * - Response format: { foods: [{ fdcId, description, foodNutrients: [{ nutrientId, nutrientName, unitName, value }] }] }
 * 
 * Features:
 * - Comprehensive search with API-first approach and local fallback
 * - Detailed nutritional information with proper nutrient mapping
 * - Caching for performance optimization
 * - Search history and suggestions
 * - Robust error handling and offline capability
 * 
 * With comprehensive fallback local database when API is unavailable
 */

// Comprehensive local nutrition database
const LOCAL_NUTRITION_DATABASE = [
  // PROTEINS
  {
    id: 'chicken-breast-raw',
    name: 'Chicken Breast (raw)',
    brand: 'Generic',
    category: 'Poultry Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      saturatedFat: 1,
      cholesterol: 85,
      vitaminA: 21,
      vitaminC: 1.2,
      calcium: 15,
      iron: 0.7
    }
  },
  {
    id: 'chicken-breast-cooked',
    name: 'Chicken Breast (cooked)',
    brand: 'Generic',
    category: 'Poultry Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 195,
      protein: 36.7,
      carbs: 0,
      fat: 4.3,
      fiber: 0,
      sugar: 0,
      sodium: 87,
      saturatedFat: 1.2,
      cholesterol: 101,
      vitaminA: 25,
      vitaminC: 1.4,
      calcium: 18,
      iron: 0.8
    }
  },
  {
    id: 'beef-ground-lean',
    name: 'Ground Beef (90% lean)',
    brand: 'Generic',
    category: 'Beef Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 176,
      protein: 20,
      carbs: 0,
      fat: 10,
      fiber: 0,
      sugar: 0,
      sodium: 66,
      saturatedFat: 4,
      cholesterol: 62,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 18,
      iron: 2.3
    }
  },
  {
    id: 'salmon-atlantic',
    name: 'Atlantic Salmon',
    brand: 'Generic',
    category: 'Finfish and Shellfish Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 208,
      protein: 25.4,
      carbs: 0,
      fat: 12.4,
      fiber: 0,
      sugar: 0,
      sodium: 44,
      saturatedFat: 3.1,
      cholesterol: 55,
      vitaminA: 58,
      vitaminC: 3.9,
      calcium: 9,
      iron: 0.3
    }
  },
  {
    id: 'eggs-whole',
    name: 'Eggs (whole)',
    brand: 'Generic',
    category: 'Dairy and Egg Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      sugar: 1.1,
      sodium: 124,
      saturatedFat: 3.3,
      cholesterol: 373,
      vitaminA: 540,
      vitaminC: 0,
      calcium: 50,
      iron: 1.2
    }
  },
  {
    id: 'tofu-firm',
    name: 'Tofu (firm)',
    brand: 'Generic',
    category: 'Legumes and Legume Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 144,
      protein: 17.3,
      carbs: 2.8,
      fat: 8.7,
      fiber: 2.3,
      sugar: 0.6,
      sodium: 11,
      saturatedFat: 1.3,
      cholesterol: 0,
      vitaminA: 5,
      vitaminC: 0.1,
      calcium: 683,
      iron: 2.7
    }
  },

  // CARBOHYDRATES
  {
    id: 'rice-brown-cooked',
    name: 'Brown Rice (cooked)',
    brand: 'Generic',
    category: 'Cereal Grains and Pasta',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 112,
      protein: 2.6,
      carbs: 22,
      fat: 0.9,
      fiber: 1.6,
      sugar: 0.7,
      sodium: 1,
      saturatedFat: 0.2,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 10,
      iron: 0.4
    }
  },
  {
    id: 'rice-white-cooked',
    name: 'White Rice (cooked)',
    brand: 'Generic',
    category: 'Cereal Grains and Pasta',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      sodium: 1,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 10,
      iron: 0.2
    }
  },
  {
    id: 'quinoa-cooked',
    name: 'Quinoa (cooked)',
    brand: 'Generic',
    category: 'Cereal Grains and Pasta',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 120,
      protein: 4.4,
      carbs: 21.8,
      fat: 1.9,
      fiber: 2.8,
      sugar: 0.9,
      sodium: 7,
      saturatedFat: 0.2,
      cholesterol: 0,
      vitaminA: 5,
      vitaminC: 0,
      calcium: 17,
      iron: 1.5
    }
  },
  {
    id: 'oats-rolled-dry',
    name: 'Rolled Oats (dry)',
    brand: 'Generic',
    category: 'Breakfast Cereals',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      fiber: 10.6,
      sugar: 0.99,
      sodium: 2,
      saturatedFat: 1.2,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 54,
      iron: 4.7
    }
  },
  {
    id: 'sweet-potato-baked',
    name: 'Sweet Potato (baked)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 90,
      protein: 2,
      carbs: 20.7,
      fat: 0.1,
      fiber: 3.3,
      sugar: 6.8,
      sodium: 6,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 19218,
      vitaminC: 19.6,
      calcium: 38,
      iron: 0.7
    }
  },
  {
    id: 'potato-russet-baked',
    name: 'Russet Potato (baked)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 93,
      protein: 2.5,
      carbs: 21.2,
      fat: 0.1,
      fiber: 2.3,
      sugar: 1.2,
      sodium: 7,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 2,
      vitaminC: 12.6,
      calcium: 15,
      iron: 1.1
    }
  },
  {
    id: 'bread-whole-wheat',
    name: 'Whole Wheat Bread',
    brand: 'Generic',
    category: 'Baked Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 247,
      protein: 13,
      carbs: 41,
      fat: 4.2,
      fiber: 7,
      sugar: 5.9,
      sodium: 400,
      saturatedFat: 0.8,
      cholesterol: 0,
      vitaminA: 1,
      vitaminC: 0.3,
      calcium: 107,
      iron: 2.5
    }
  },
  {
    id: 'pasta-whole-wheat-cooked',
    name: 'Whole Wheat Pasta (cooked)',
    brand: 'Generic',
    category: 'Cereal Grains and Pasta',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 124,
      protein: 5.3,
      carbs: 25.1,
      fat: 1.1,
      fiber: 3.9,
      sugar: 0.8,
      sodium: 4,
      saturatedFat: 0.2,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 15,
      iron: 1.5
    }
  },

  // FRUITS
  {
    id: 'apple-with-skin',
    name: 'Apple (with skin)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10.4,
      sodium: 1,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 54,
      vitaminC: 4.6,
      calcium: 6,
      iron: 0.1
    }
  },
  {
    id: 'banana-raw',
    name: 'Banana (raw)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2,
      sodium: 1,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 64,
      vitaminC: 8.7,
      calcium: 5,
      iron: 0.3
    }
  },
  {
    id: 'orange-raw',
    name: 'Orange (raw)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 47,
      protein: 0.9,
      carbs: 11.8,
      fat: 0.1,
      fiber: 2.4,
      sugar: 9.4,
      sodium: 0,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 225,
      vitaminC: 53.2,
      calcium: 40,
      iron: 0.1
    }
  },
  {
    id: 'blueberries-raw',
    name: 'Blueberries (raw)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      fiber: 2.4,
      sugar: 10,
      sodium: 1,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 54,
      vitaminC: 9.7,
      calcium: 6,
      iron: 0.3
    }
  },
  {
    id: 'strawberries-raw',
    name: 'Strawberries (raw)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 32,
      protein: 0.7,
      carbs: 7.7,
      fat: 0.3,
      fiber: 2,
      sugar: 4.9,
      sodium: 1,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 12,
      vitaminC: 58.8,
      calcium: 16,
      iron: 0.4
    }
  },
  {
    id: 'avocado-raw',
    name: 'Avocado (raw)',
    brand: 'Generic',
    category: 'Fruits and Fruit Juices',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7,
      sugar: 0.7,
      sodium: 7,
      saturatedFat: 2.1,
      cholesterol: 0,
      vitaminA: 146,
      vitaminC: 10,
      calcium: 12,
      iron: 0.6
    }
  },

  // VEGETABLES
  {
    id: 'broccoli-raw',
    name: 'Broccoli (raw)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 34,
      protein: 2.8,
      carbs: 6.6,
      fat: 0.4,
      fiber: 2.6,
      sugar: 1.5,
      sodium: 33,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 623,
      vitaminC: 89.2,
      calcium: 47,
      iron: 0.7
    }
  },
  {
    id: 'spinach-raw',
    name: 'Spinach (raw)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      sugar: 0.4,
      sodium: 79,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 9377,
      vitaminC: 28.1,
      calcium: 99,
      iron: 2.7
    }
  },
  {
    id: 'carrots-raw',
    name: 'Carrots (raw)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 41,
      protein: 0.9,
      carbs: 9.6,
      fat: 0.2,
      fiber: 2.8,
      sugar: 4.7,
      sodium: 69,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 16706,
      vitaminC: 5.9,
      calcium: 33,
      iron: 0.3
    }
  },
  {
    id: 'tomatoes-raw',
    name: 'Tomatoes (raw)',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 18,
      protein: 0.9,
      carbs: 3.9,
      fat: 0.2,
      fiber: 1.2,
      sugar: 2.6,
      sodium: 5,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 833,
      vitaminC: 13.7,
      calcium: 10,
      iron: 0.3
    }
  },
  {
    id: 'bell-pepper-red',
    name: 'Red Bell Pepper',
    brand: 'Generic',
    category: 'Vegetables and Vegetable Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 31,
      protein: 1,
      carbs: 7.3,
      fat: 0.3,
      fiber: 2.5,
      sugar: 4.2,
      sodium: 4,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 3131,
      vitaminC: 127.7,
      calcium: 7,
      iron: 0.4
    }
  },

  // DAIRY
  {
    id: 'milk-whole',
    name: 'Whole Milk',
    brand: 'Generic',
    category: 'Dairy and Egg Products',
    serving: { size: 100, unit: 'ml' },
    nutrition: {
      calories: 61,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.3,
      fiber: 0,
      sugar: 5.1,
      sodium: 44,
      saturatedFat: 1.9,
      cholesterol: 10,
      vitaminA: 395,
      vitaminC: 0,
      calcium: 113,
      iron: 0
    }
  },
  {
    id: 'greek-yogurt-plain',
    name: 'Greek Yogurt (plain)',
    brand: 'Generic',
    category: 'Dairy and Egg Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      sugar: 3.6,
      sodium: 36,
      saturatedFat: 0.1,
      cholesterol: 5,
      vitaminA: 27,
      vitaminC: 0,
      calcium: 110,
      iron: 0.1
    }
  },
  {
    id: 'cheddar-cheese',
    name: 'Cheddar Cheese',
    brand: 'Generic',
    category: 'Dairy and Egg Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 403,
      protein: 25,
      carbs: 1.3,
      fat: 33,
      fiber: 0,
      sugar: 0.5,
      sodium: 621,
      saturatedFat: 21,
      cholesterol: 105,
      vitaminA: 1242,
      vitaminC: 0,
      calcium: 721,
      iron: 0.7
    }
  },

  // NUTS AND SEEDS
  {
    id: 'almonds-raw',
    name: 'Almonds (raw)',
    brand: 'Generic',
    category: 'Nut and Seed Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 579,
      protein: 21.2,
      carbs: 21.6,
      fat: 49.9,
      fiber: 12.5,
      sugar: 4.4,
      sodium: 1,
      saturatedFat: 3.8,
      cholesterol: 0,
      vitaminA: 2,
      vitaminC: 0,
      calcium: 269,
      iron: 3.7
    }
  },
  {
    id: 'walnuts-raw',
    name: 'Walnuts (raw)',
    brand: 'Generic',
    category: 'Nut and Seed Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 654,
      protein: 15.2,
      carbs: 13.7,
      fat: 65.2,
      fiber: 6.7,
      sugar: 2.6,
      sodium: 2,
      saturatedFat: 6.1,
      cholesterol: 0,
      vitaminA: 20,
      vitaminC: 1.3,
      calcium: 98,
      iron: 2.9
    }
  },
  {
    id: 'peanut-butter',
    name: 'Peanut Butter (smooth)',
    brand: 'Generic',
    category: 'Nut and Seed Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 588,
      protein: 25,
      carbs: 20,
      fat: 50,
      fiber: 6,
      sugar: 9.2,
      sodium: 17,
      saturatedFat: 10,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 43,
      iron: 1.9
    }
  },

  // LEGUMES
  {
    id: 'black-beans-cooked',
    name: 'Black Beans (cooked)',
    brand: 'Generic',
    category: 'Legumes and Legume Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 132,
      protein: 8.9,
      carbs: 23,
      fat: 0.5,
      fiber: 8.7,
      sugar: 0.3,
      sodium: 2,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 6,
      vitaminC: 0,
      calcium: 27,
      iron: 2.1
    }
  },
  {
    id: 'chickpeas-cooked',
    name: 'Chickpeas (cooked)',
    brand: 'Generic',
    category: 'Legumes and Legume Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 164,
      protein: 8.9,
      carbs: 27.4,
      fat: 2.6,
      fiber: 7.6,
      sugar: 4.8,
      sodium: 7,
      saturatedFat: 0.3,
      cholesterol: 0,
      vitaminA: 27,
      vitaminC: 1.3,
      calcium: 49,
      iron: 2.9
    }
  },
  {
    id: 'lentils-cooked',
    name: 'Lentils (cooked)',
    brand: 'Generic',
    category: 'Legumes and Legume Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 116,
      protein: 9,
      carbs: 20,
      fat: 0.4,
      fiber: 7.9,
      sugar: 1.8,
      sodium: 2,
      saturatedFat: 0.1,
      cholesterol: 0,
      vitaminA: 8,
      vitaminC: 1.5,
      calcium: 19,
      iron: 3.3
    }
  },

  // OILS AND FATS
  {
    id: 'olive-oil-extra-virgin',
    name: 'Extra Virgin Olive Oil',
    brand: 'Generic',
    category: 'Fats and Oils',
    serving: { size: 100, unit: 'ml' },
    nutrition: {
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      sugar: 0,
      sodium: 2,
      saturatedFat: 13.8,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 1,
      iron: 0.6
    }
  },

  // BEVERAGES
  {
    id: 'water',
    name: 'Water',
    brand: 'Generic',
    category: 'Beverages',
    serving: { size: 100, unit: 'ml' },
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 1,
      saturatedFat: 0,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 2,
      iron: 0
    }
  },

  // COMMON SNACKS AND PROCESSED FOODS
  {
    id: 'dark-chocolate-70',
    name: 'Dark Chocolate (70% cacao)',
    brand: 'Generic',
    category: 'Sweets',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 579,
      protein: 7.9,
      carbs: 45.9,
      fat: 42.6,
      fiber: 10.9,
      sugar: 24,
      sodium: 12,
      saturatedFat: 24.5,
      cholesterol: 2,
      vitaminA: 39,
      vitaminC: 0,
      calcium: 73,
      iron: 11.9
    }
  },
  {
    id: 'white-bread',
    name: 'White Bread',
    brand: 'Generic',
    category: 'Baked Products',
    serving: { size: 100, unit: 'g' },
    nutrition: {
      calories: 265,
      protein: 9,
      carbs: 49,
      fat: 3.2,
      fiber: 2.7,
      sugar: 5.7,
      sodium: 681,
      saturatedFat: 0.8,
      cholesterol: 0,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 151,
      iron: 3.6
    }
  }
];

class NutritionService {
  constructor() {
    this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = 'fOPqaxXTfIhxp0NYDqQaCa2KHU0Ch9b8dIzJUTnY'; // USDA FoodData Central API key
    this.cache = new Map();
    this.searchHistory = [];
    this.recentSearches = [];
    this.maxCacheSize = 100;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.localDatabase = LOCAL_NUTRITION_DATABASE;
    this.useApiFirst = true; // Enable API first with proper fallback
  }

  /**
   * Set API key for USDA FoodData Central API
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Search foods using USDA API with local fallback
   */
  async searchFoods(query, options = {}) {
    const {
      pageSize = 25,
      pageNumber = 1,
      dataType = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    // Check cache first
    const cacheKey = `search_${query}_${pageSize}_${pageNumber}_${dataType.join('_')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('🔄 Returning cached food search results');
      return cached;
    }

    // Try USDA API first if we have an API key and user preference
    let apiResults = null;
    if (this.useApiFirst && this.apiKey) {
      try {
        console.log('🔍 Trying USDA API for:', query);
        apiResults = await this.searchUSDAFoods(query, options);
        
        // Only use API results if we got actual results
        if (apiResults && apiResults.foods && apiResults.foods.length > 0) {
          // Cache and return API results
          this.setCache(cacheKey, apiResults);
          this.addToSearchHistory(query, apiResults.totalHits);
          
          console.log(`✅ USDA API: Found ${apiResults.foods.length} foods for "${query}"`);
          return apiResults;
        } else {
          console.log('⚠️ USDA API returned no results, trying local database');
        }
        
      } catch (error) {
        console.warn('⚠️ USDA API failed, falling back to local database:', error.message);
        // Continue to local search below
      }
    }

    // Always try local database if API didn't return results or failed
    try {
      console.log('🔍 Searching local nutrition database for:', query);
      const localResults = this.searchLocalDatabase(query, options);
      
      // If we have local results, use them
      if (localResults && localResults.foods && localResults.foods.length > 0) {
        // Cache results
        this.setCache(cacheKey, localResults);
        this.addToSearchHistory(query, localResults.totalHits);
        
        console.log(`✅ Local DB: Found ${localResults.foods.length} foods for "${query}"`);
        return localResults;
      }
      
      // If neither API nor local has results, return empty result
      const emptyResult = {
        foods: [],
        totalHits: 0,
        currentPage: 1,
        totalPages: 0,
        query: query,
        searchTime: new Date().toISOString(),
        source: 'None'
      };
      
      console.log(`ℹ️ No results found for "${query}" in API or local database`);
      return emptyResult;
      
    } catch (error) {
      console.error('❌ Local food search failed:', error);
      // Return empty result instead of throwing
      return {
        foods: [],
        totalHits: 0,
        currentPage: 1,
        totalPages: 0,
        query: query,
        searchTime: new Date().toISOString(),
        source: 'Error'
      };
    }
  }

  /**
   * Search USDA FoodData Central API
   */
  async searchUSDAFoods(query, options) {
    const {
      pageSize = 25,
      pageNumber = 1,
      dataType = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    // Use GET request first since we confirmed it works in direct testing
    const searchUrl = new URL(`${this.baseUrl}/foods/search`);
    searchUrl.searchParams.set('api_key', this.apiKey);
    searchUrl.searchParams.set('query', query.trim());
    searchUrl.searchParams.set('pageSize', Math.min(pageSize, 200).toString());
    searchUrl.searchParams.set('pageNumber', Math.max(pageNumber, 1).toString());
    
    // Add dataType parameters (can be multiple)
    if (Array.isArray(dataType)) {
      dataType.forEach(type => searchUrl.searchParams.append('dataType', type));
    } else {
      searchUrl.searchParams.set('dataType', dataType);
    }

    console.log(`🌐 USDA API search URL: ${searchUrl.toString()}`);

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.log(`API Error Details: ${response.status} ${response.statusText} - ${errorText}`);
      
      if (response.status === 403) {
        throw new Error('USDA API requires authentication. API key needed.');
      }
      if (response.status === 400) {
        throw new Error(`USDA API: Invalid request parameters - ${errorText}`);
      }
      if (response.status === 500) {
        throw new Error(`USDA API: Server error - ${errorText}`);
      }
      throw new Error(`USDA API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`🌐 USDA API raw response:`, {
      totalHits: data.totalHits,
      foodsCount: data.foods?.length || 0,
      firstFood: data.foods?.[0] ? {
        fdcId: data.foods[0].fdcId,
        description: data.foods[0].description,
        nutrientsCount: data.foods[0].foodNutrients?.length || 0
      } : null
    });
    
    // Transform to consistent format
    const transformedFoods = data.foods?.map(food => {
      const transformed = this.transformUSDAFood(food);
      console.log(`🔄 Transformed food:`, {
        fdcId: transformed.fdcId,
        description: transformed.description,
        calories: transformed.calories,
        protein: transformed.protein
      });
      return transformed;
    }) || [];
    
    const result = {
      foods: transformedFoods,
      totalHits: data.totalHits || 0,
      currentPage: data.currentPage || pageNumber,
      totalPages: Math.ceil((data.totalHits || 0) / pageSize),
      query: query,
      searchTime: new Date().toISOString(),
      source: 'USDA'
    };
    
    console.log(`🌐 USDA API final result:`, {
      foodsCount: result.foods.length,
      totalHits: result.totalHits,
      source: result.source
    });
    
    return result;
  }

  /**
   * Search local nutrition database
   */
  searchLocalDatabase(query, options = {}) {
    const {
      pageSize = 25,
      pageNumber = 1,
      category = null
    } = options;

    const lowerQuery = query.toLowerCase().trim();
    
    // Search by name, brand, or category
    let filteredFoods = this.localDatabase.filter(food => {
      const nameMatch = food.name.toLowerCase().includes(lowerQuery);
      const brandMatch = food.brand.toLowerCase().includes(lowerQuery);
      const categoryMatch = food.category.toLowerCase().includes(lowerQuery);
      
      const queryMatch = nameMatch || brandMatch || categoryMatch;
      
      // Apply category filter if specified
      if (category && category !== 'All') {
        return queryMatch && food.category === category;
      }
      
      return queryMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    filteredFoods.sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
      const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      const aStarts = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      
      return a.name.localeCompare(b.name);
    });

    // Paginate
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFoods = filteredFoods.slice(startIndex, endIndex);

    // Transform to consistent format
    const transformedFoods = paginatedFoods.map(food => this.transformLocalFood(food));

    return {
      foods: transformedFoods,
      totalHits: filteredFoods.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(filteredFoods.length / pageSize),
      query: query,
      searchTime: new Date().toISOString(),
      source: 'Local'
    };
  }

  /**
   * Get detailed food information by FDC ID (USDA) or local ID
   */
  async getFoodDetails(foodId, format = 'abridged') {
    const cacheKey = `food_${foodId}_${format}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('🔄 Returning cached food details');
      return cached;
    }

    // Check if it's a local database ID
    if (typeof foodId === 'string' && foodId.includes('-')) {
      const localFood = this.localDatabase.find(food => food.id === foodId);
      if (localFood) {
        const transformedFood = this.transformLocalFood(localFood);
        this.setCache(cacheKey, transformedFood);
        console.log(`✅ Local food details retrieved: ${transformedFood.description}`);
        return transformedFood;
      }
    }

    // Try USDA API if we have API key
    if (this.apiKey) {
      try {
        console.log('📊 Fetching USDA food details:', foodId);

        const url = this.apiKey 
          ? `${this.baseUrl}/food/${foodId}?format=${format}&api_key=${this.apiKey}`
          : `${this.baseUrl}/food/${foodId}?format=${format}`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('USDA API requires authentication');
          }
          throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const transformedFood = this.transformDetailedUSDAFood(data);

        // Cache results
        this.setCache(cacheKey, transformedFood);

        console.log(`✅ USDA food details retrieved: ${transformedFood.description}`);
        return transformedFood;

      } catch (error) {
        console.warn('⚠️ USDA API failed for food details, checking local database');
      }
    }

    throw new Error(`Food not found: ${foodId}`);
  }

  /**
   * Transform local database food to consistent format
   */
  transformLocalFood(food) {
    return {
      fdcId: food.id,
      description: food.name,
      scientificName: '',
      commonName: food.name,
      dataType: 'Local',
      category: food.category,
      nutrients: this.transformLocalNutrients(food.nutrition),
      servingSize: food.serving.size,
      servingSizeUnit: food.serving.unit,
      householdServingFullText: `${food.serving.size}${food.serving.unit}`,
      brandOwner: food.brand,
      brandName: food.brand,
      subbrandName: '',
      ingredients: '',
      
      // Computed fields
      calories: { value: food.nutrition.calories, unit: 'kcal', name: 'Energy' },
      protein: { value: food.nutrition.protein, unit: 'g', name: 'Protein' },
      carbs: { value: food.nutrition.carbs, unit: 'g', name: 'Carbohydrate' },
      fat: { value: food.nutrition.fat, unit: 'g', name: 'Total lipid (fat)' },
      fiber: food.nutrition.fiber ? { value: food.nutrition.fiber, unit: 'g', name: 'Fiber' } : null,
      sugar: food.nutrition.sugar ? { value: food.nutrition.sugar, unit: 'g', name: 'Sugars' } : null,
      sodium: food.nutrition.sodium ? { value: food.nutrition.sodium, unit: 'mg', name: 'Sodium' } : null,
      
      // Additional nutrients
      saturatedFat: food.nutrition.saturatedFat ? { value: food.nutrition.saturatedFat, unit: 'g', name: 'Saturated fat' } : null,
      cholesterol: food.nutrition.cholesterol ? { value: food.nutrition.cholesterol, unit: 'mg', name: 'Cholesterol' } : null,
      vitaminA: food.nutrition.vitaminA ? { value: food.nutrition.vitaminA, unit: 'IU', name: 'Vitamin A' } : null,
      vitaminC: food.nutrition.vitaminC ? { value: food.nutrition.vitaminC, unit: 'mg', name: 'Vitamin C' } : null,
      calcium: food.nutrition.calcium ? { value: food.nutrition.calcium, unit: 'mg', name: 'Calcium' } : null,
      iron: food.nutrition.iron ? { value: food.nutrition.iron, unit: 'mg', name: 'Iron' } : null,
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      source: 'Local'
    };
  }

  /**
   * Transform local nutrition data to organized object
   */
  transformLocalNutrients(nutrition) {
    const organized = {};
    
    // Map common nutrients with standardized numbers
    const nutrientMap = {
      calories: { number: 1008, name: 'Energy', unit: 'kcal' },
      protein: { number: 1003, name: 'Protein', unit: 'g' },
      carbs: { number: 1005, name: 'Carbohydrate', unit: 'g' },
      fat: { number: 1004, name: 'Total lipid (fat)', unit: 'g' },
      fiber: { number: 1079, name: 'Fiber', unit: 'g' },
      sugar: { number: 2000, name: 'Sugars', unit: 'g' },
      sodium: { number: 1093, name: 'Sodium', unit: 'mg' },
      saturatedFat: { number: 1258, name: 'Saturated fat', unit: 'g' },
      cholesterol: { number: 1253, name: 'Cholesterol', unit: 'mg' },
      vitaminA: { number: 1106, name: 'Vitamin A', unit: 'IU' },
      vitaminC: { number: 1162, name: 'Vitamin C', unit: 'mg' },
      calcium: { number: 1087, name: 'Calcium', unit: 'mg' },
      iron: { number: 1089, name: 'Iron', unit: 'mg' }
    };

    Object.keys(nutrition).forEach(key => {
      if (nutrientMap[key] && nutrition[key] !== undefined && nutrition[key] !== null) {
        const nutrientInfo = nutrientMap[key];
        organized[nutrientInfo.number] = {
          id: nutrientInfo.number,
          number: nutrientInfo.number,
          name: nutrientInfo.name,
          rank: 1,
          unitName: nutrientInfo.unit,
          value: nutrition[key],
          derivationCode: 'LOCAL',
          derivationDescription: 'Local Database'
        };
      }
    });
    
    return organized;
  }

  /**
   * Transform USDA food data to consistent format
   */
  transformUSDAFood(food) {
    // Add some debugging for problematic foods
    const nutrients = food.foodNutrients || [];
    
    return {
      fdcId: food.fdcId,
      description: food.description,
      scientificName: food.scientificName || '',
      commonName: food.commonNames?.[0] || food.description || '',
      dataType: food.dataType,
      category: food.foodCategory || food.category || '',
      nutrients: this.transformNutrients(nutrients),
      servingSize: food.servingSize || 100,
      servingSizeUnit: food.servingSizeUnit || 'g',
      householdServingFullText: food.householdServingFullText || `${food.servingSize || 100}${food.servingSizeUnit || 'g'}`,
      brandOwner: food.brandOwner || food.brandName || '',
      brandName: food.brandName || '',
      subbrandName: food.subbrandName || '',
      ingredients: food.ingredients || '',
      
      // Computed fields - use nutrient ID numbers for FoodData Central
      calories: this.extractNutrientFromFDC(nutrients, 1008) || this.extractNutrientFromFDC(nutrients, 2047), // Energy (kcal)
      protein: this.extractNutrientFromFDC(nutrients, 1003), // Protein
      carbs: this.extractNutrientFromFDC(nutrients, 1005), // Carbohydrate
      fat: this.extractNutrientFromFDC(nutrients, 1004), // Total lipid (fat)
      fiber: this.extractNutrientFromFDC(nutrients, 1079), // Fiber
      sugar: this.extractNutrientFromFDC(nutrients, 2000), // Sugars
      sodium: this.extractNutrientFromFDC(nutrients, 1093), // Sodium
      
      // Additional nutrients
      saturatedFat: this.extractNutrientFromFDC(nutrients, 1258),
      cholesterol: this.extractNutrientFromFDC(nutrients, 1253),
      vitaminA: this.extractNutrientFromFDC(nutrients, 1106),
      vitaminC: this.extractNutrientFromFDC(nutrients, 1162),
      calcium: this.extractNutrientFromFDC(nutrients, 1087),
      iron: this.extractNutrientFromFDC(nutrients, 1089),
      
      // Metadata
      lastUpdated: food.modifiedDate || food.publicationDate || new Date().toISOString(),
      source: 'USDA'
    };
  }

  /**
   * Transform detailed USDA food data
   */
  transformDetailedUSDAFood(food) {
    const basic = this.transformUSDAFood(food);
    
    return {
      ...basic,
      nutrientConversionFactors: food.nutrientConversionFactors || [],
      isHistoricalReference: food.isHistoricalReference || false,
      ndbNumber: food.ndbNumber || null,
      
      // Additional nutrients for detailed view - use FDC extraction
      vitaminC: this.extractNutrientFromFDC(food.foodNutrients, 1162),
      calcium: this.extractNutrientFromFDC(food.foodNutrients, 1087),
      iron: this.extractNutrientFromFDC(food.foodNutrients, 1089),
      potassium: this.extractNutrientFromFDC(food.foodNutrients, 1092),
      magnesium: this.extractNutrientFromFDC(food.foodNutrients, 1090),
      phosphorus: this.extractNutrientFromFDC(food.foodNutrients, 1091),
      zinc: this.extractNutrientFromFDC(food.foodNutrients, 1095),
      
      // Vitamins
      vitaminA: this.extractNutrientFromFDC(food.foodNutrients, 1106),
      vitaminE: this.extractNutrientFromFDC(food.foodNutrients, 1158),
      vitaminK: this.extractNutrientFromFDC(food.foodNutrients, 1185),
      folate: this.extractNutrientFromFDC(food.foodNutrients, 1177),
      vitaminB12: this.extractNutrientFromFDC(food.foodNutrients, 1178),
      
      // Fats breakdown
      saturatedFat: this.extractNutrientFromFDC(food.foodNutrients, 1258),
      monounsaturatedFat: this.extractNutrientFromFDC(food.foodNutrients, 1292),
      polyunsaturatedFat: this.extractNutrientFromFDC(food.foodNutrients, 1293),
      transFat: this.extractNutrientFromFDC(food.foodNutrients, 1257),
      cholesterol: this.extractNutrientFromFDC(food.foodNutrients, 1253)
    };
  }

  /**
   * Transform nutrients array to organized object
   */
  transformNutrients(nutrients) {
    const organized = {};
    
    nutrients.forEach(nutrient => {
      // Handle both legacy USDA format and FoodData Central format
      let nutrientInfo, value, derivationCode, derivationDescription;
      
      if (nutrient.nutrient) {
        // Legacy USDA format
        nutrientInfo = {
          id: nutrient.nutrient.id,
          number: nutrient.nutrient.number,
          name: nutrient.nutrient.name,
          rank: nutrient.nutrient.rank,
          unitName: nutrient.nutrient.unitName
        };
        value = nutrient.amount;
        derivationCode = nutrient.foodNutrientDerivation?.code;
        derivationDescription = nutrient.foodNutrientDerivation?.description;
      } else {
        // FoodData Central format
        nutrientInfo = {
          id: nutrient.nutrientId,
          number: nutrient.nutrientId || parseInt(nutrient.nutrientNumber),
          name: nutrient.nutrientName || nutrient.name,
          rank: 1,
          unitName: nutrient.unitName || nutrient.unit
        };
        value = nutrient.value || nutrient.amount;
        derivationCode = 'FDC';
        derivationDescription = 'FoodData Central';
      }
      
      if (nutrientInfo.number) {
        organized[nutrientInfo.number] = {
          ...nutrientInfo,
          value: value || 0,
          derivationCode,
          derivationDescription
        };
      }
    });
    
    return organized;
  }

  /**
   * Extract specific nutrient value from USDA format
   */
  extractNutrient(nutrients, nutrientNumber) {
    if (!nutrients) return null;
    
    const nutrient = nutrients.find(n => n.nutrient?.number === nutrientNumber);
    return nutrient ? {
      value: nutrient.amount,
      unit: nutrient.nutrient?.unitName || '',
      name: nutrient.nutrient?.name || ''
    } : null;
  }

  /**
   * Extract specific nutrient value from FoodData Central format
   */
  extractNutrientFromFDC(nutrients, nutrientId) {
    if (!nutrients || !Array.isArray(nutrients)) return null;
    
    // Create mapping for both 3-digit and 4-digit nutrient numbers
    // USDA API sometimes returns 3-digit (203, 204, 205, 208) vs 4-digit (1003, 1004, 1005, 1008)
    const nutrientMappings = {
      1003: [1003, 203], // Protein
      1004: [1004, 204], // Total lipid (fat) 
      1005: [1005, 205], // Carbohydrate
      1008: [1008, 208], // Energy (calories)
      1079: [1079, 291], // Fiber
      1093: [1093, 307], // Sodium
      1258: [1258, 606], // Saturated fat
      1253: [1253, 601], // Cholesterol
      1106: [1106, 318], // Vitamin A
      1162: [1162, 401], // Vitamin C
      1087: [1087, 301], // Calcium
      1089: [1089, 303], // Iron
      2000: [2000, 269]  // Total Sugars
    };
    
    // Get possible numbers to search for
    const searchNumbers = nutrientMappings[nutrientId] || [nutrientId];
    
    // USDA API has multiple response formats:
    // 1. Search API (/foods/search): nutrientId, nutrientName, value, unitName
    // 2. Details API (/food/{id}): number, name, amount, unitName
    // 3. Legacy format: nutrient.id, nutrient.number, nutrient.name, amount
    
    const nutrient = nutrients.find(n => {
      // Handle different ID formats
      let nId = null;
      
      if (n.nutrientId !== undefined) {
        // Search API format
        nId = parseInt(n.nutrientId);
      } else if (n.number !== undefined) {
        // Details API format - number is a string like "203", "208"
        nId = parseInt(n.number);
      } else if (n.nutrient?.number !== undefined) {
        // Legacy format with nested nutrient object
        nId = parseInt(n.nutrient.number);
      } else if (n.nutrient?.id !== undefined) {
        // Legacy format with nested nutrient ID
        nId = parseInt(n.nutrient.id);
      }
      
      // Check if this nutrient matches our search criteria
      return searchNumbers.includes(nId);
    });
    
    if (nutrient) {
      // Extract value - different property names in different formats
      let value = 0;
      if (nutrient.value !== undefined) {
        // Search API format
        value = parseFloat(nutrient.value) || 0;
      } else if (nutrient.amount !== undefined) {
        // Details API or legacy format
        value = parseFloat(nutrient.amount) || 0;
      }
      
      // Extract unit name
      let unit = '';
      if (nutrient.unitName) {
        unit = nutrient.unitName;
      } else if (nutrient.unit) {
        unit = nutrient.unit;
      } else if (nutrient.nutrient?.unitName) {
        unit = nutrient.nutrient.unitName;
      }
      
      // Extract nutrient name
      let name = '';
      if (nutrient.nutrientName) {
        name = nutrient.nutrientName;
      } else if (nutrient.name) {
        name = nutrient.name;
      } else if (nutrient.nutrient?.name) {
        name = nutrient.nutrient.name;
      }
      
      return {
        value: value,
        unit: unit,
        name: name
      };
    }
    
    return null;
  }

  /**
   * Get multiple foods by FDC IDs with local fallback
   */
  async getFoodsByIds(foodIds, format = 'abridged') {
    if (!Array.isArray(foodIds) || foodIds.length === 0) {
      return [];
    }

    const allResults = [];

    for (const foodId of foodIds) {
      try {
        const food = await this.getFoodDetails(foodId, format);
        allResults.push(food);
      } catch (error) {
        console.warn(`Failed to get food ${foodId}:`, error);
        // Continue with other foods
      }
    }

    console.log(`✅ Retrieved ${allResults.length} foods by IDs`);
    return allResults;
  }

  /**
   * Get popular food suggestions
   */
  getPopularFoods() {
    return [
      'chicken breast', 'salmon', 'eggs', 'greek yogurt', 'almonds',
      'quinoa', 'brown rice', 'sweet potato', 'broccoli', 'spinach',
      'avocado', 'banana', 'apple', 'oats', 'black beans'
    ];
  }

  /**
   * Get food categories for filtering
   */
  getFoodCategories() {
    // Get unique categories from local database
    const localCategories = [...new Set(this.localDatabase.map(food => food.category))].sort();
    
    // Merge with common USDA categories
    const usdaCategories = [
      'Fruits and Fruit Juices',
      'Vegetables and Vegetable Products',
      'Dairy and Egg Products',
      'Poultry Products',
      'Beef Products',
      'Pork Products',
      'Finfish and Shellfish Products',
      'Legumes and Legume Products',
      'Nut and Seed Products',
      'Cereal Grains and Pasta',
      'Breakfast Cereals',
      'Fats and Oils',
      'Snacks',
      'Sweets',
      'Beverages',
      'Baby Foods',
      'Spices and Herbs'
    ];

    return [...new Set([...localCategories, ...usdaCategories])].sort();
  }

  /**
   * Calculate macronutrient percentages
   */
  calculateMacroPercentages(food) {
    const calories = food.calories?.value || 0;
    const protein = food.protein?.value || 0;
    const carbs = food.carbs?.value || 0;
    const fat = food.fat?.value || 0;

    if (calories === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatCals = fat * 9;

    const totalMacroCals = proteinCals + carbsCals + fatCals;

    if (totalMacroCals === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((proteinCals / totalMacroCals) * 100),
      carbs: Math.round((carbsCals / totalMacroCals) * 100),
      fat: Math.round((fatCals / totalMacroCals) * 100)
    };
  }

  /**
   * Toggle between API-first and local-first search
   */
  setSearchPreference(useApiFirst = true) {
    this.useApiFirst = useApiFirst;
    console.log(`🔄 Search preference: ${useApiFirst ? 'API first' : 'Local first'}`);
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return {
      localFoodsCount: this.localDatabase.length,
      localCategories: [...new Set(this.localDatabase.map(food => food.category))].length,
      hasApiKey: !!this.apiKey,
      searchPreference: this.useApiFirst ? 'API first' : 'Local first',
      cacheSize: this.cache.size,
      searchHistoryCount: this.searchHistory.length
    };
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    // Clear old cache if at limit
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query, resultCount) {
    const historyEntry = {
      query: query.trim().toLowerCase(),
      resultCount,
      timestamp: new Date().toISOString()
    };

    // Remove duplicates
    this.searchHistory = this.searchHistory.filter(entry => entry.query !== historyEntry.query);
    
    // Add to front
    this.searchHistory.unshift(historyEntry);
    
    // Keep only last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

    // Update recent searches (last 10 unique)
    this.recentSearches = this.searchHistory.slice(0, 10);
  }

  /**
   * Get search suggestions based on history and local database
   */
  getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return this.recentSearches.map(entry => entry.query);
    }

    const lowerQuery = query.toLowerCase();
    
    // Get suggestions from search history
    const historySuggestions = this.searchHistory
      .filter(entry => entry.query.includes(lowerQuery))
      .slice(0, 3)
      .map(entry => entry.query);

    // Get suggestions from local database
    const localSuggestions = this.localDatabase
      .filter(food => food.name.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map(food => food.name.toLowerCase());

    // Get suggestions from popular foods
    const popularMatches = this.getPopularFoods()
      .filter(food => food.toLowerCase().includes(lowerQuery))
      .slice(0, 3);

    return [...new Set([...historySuggestions, ...localSuggestions, ...popularMatches])];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Nutrition service cache cleared');
  }

  /**
   * Get service statistics
   */
  getStats() {
    const dbStats = this.getDatabaseStats();
    return {
      ...dbStats,
      lastActivity: this.searchHistory[0]?.timestamp || null
    };
  }
}

// Create singleton instance
const nutritionService = new NutritionService();

module.exports = nutritionService;
module.exports.default = nutritionService;
module.exports.NutritionService = NutritionService;