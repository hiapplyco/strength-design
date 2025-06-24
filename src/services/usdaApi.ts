
export interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  dataType: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface NormalizedFood {
  id: string;
  name: string;
  brand?: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving: number;
  serving_size: number;
  serving_unit: string;
  data_source: 'usda' | 'local';
  usda_fdc_id?: number;
}

class USDAApiService {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchFoods(query: string, pageSize: number = 25, pageNumber: number = 1): Promise<USDASearchResponse> {
    const response = await fetch(`${this.baseUrl}/foods/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        pageSize,
        pageNumber,
        dataType: ['Branded', 'Foundation', 'SR Legacy'],
        sortBy: 'score',
        sortOrder: 'desc'
      })
    });

    if (!response.ok) {
      throw new Error(`USDA API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getFoodDetails(fdcId: number): Promise<USDAFood> {
    const response = await fetch(`${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`);
    
    if (!response.ok) {
      throw new Error(`USDA API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  normalizeUSDAFood(usdaFood: USDAFood): NormalizedFood {
    // Extract nutrients by nutrient number (USDA standard codes)
    const nutrients = this.extractNutrients(usdaFood.foodNutrients);
    
    // Determine serving size - use provided serving size or default to 100g
    const servingSize = usdaFood.servingSize || 100;
    const servingUnit = usdaFood.servingSizeUnit || 'g';
    
    // Calculate per-serving values based on the serving size
    const multiplier = servingSize / 100; // Most USDA values are per 100g
    
    return {
      id: `usda_${usdaFood.fdcId}`,
      name: usdaFood.description,
      brand: usdaFood.brandOwner || usdaFood.brandName,
      calories_per_serving: (nutrients.calories || 0) * multiplier,
      protein_per_serving: (nutrients.protein || 0) * multiplier,
      carbs_per_serving: (nutrients.carbs || 0) * multiplier,
      fat_per_serving: (nutrients.fat || 0) * multiplier,
      fiber_per_serving: (nutrients.fiber || 0) * multiplier,
      serving_size: servingSize,
      serving_unit: servingUnit,
      data_source: 'usda',
      usda_fdc_id: usdaFood.fdcId
    };
  }

  private extractNutrients(foodNutrients: USDANutrient[]) {
    const nutrientMap: { [key: string]: number } = {};
    
    foodNutrients.forEach(nutrient => {
      nutrientMap[nutrient.nutrientNumber] = nutrient.value;
    });

    return {
      calories: nutrientMap['208'] || 0, // Energy (kcal)
      protein: nutrientMap['203'] || 0, // Protein
      fat: nutrientMap['204'] || 0, // Total lipid (fat)
      carbs: (nutrientMap['205'] || 0) - (nutrientMap['291'] || 0), // Carbohydrate minus fiber for net carbs
      fiber: nutrientMap['291'] || 0, // Fiber, total dietary
    };
  }
}

export { USDAApiService };
