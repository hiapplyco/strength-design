
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  dataType: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
}

interface NormalizedFood {
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
  data_source: 'usda';
  usda_fdc_id: number;
}

function extractNutrients(foodNutrients: USDAFood['foodNutrients']) {
  const nutrientMap: { [key: string]: number } = {};
  
  foodNutrients.forEach(nutrient => {
    nutrientMap[nutrient.nutrientNumber] = nutrient.value;
  });

  return {
    calories: nutrientMap['208'] || 0, // Energy (kcal)
    protein: nutrientMap['203'] || 0, // Protein
    fat: nutrientMap['204'] || 0, // Total lipid (fat)
    carbs: (nutrientMap['205'] || 0) - (nutrientMap['291'] || 0), // Net carbs
    fiber: nutrientMap['291'] || 0, // Fiber, total dietary
  };
}

function normalizeUSDAFood(usdaFood: USDAFood): NormalizedFood {
  const nutrients = extractNutrients(usdaFood.foodNutrients);
  const servingSize = usdaFood.servingSize || 100;
  const servingUnit = usdaFood.servingSizeUnit || 'g';
  const multiplier = servingSize / 100; // Most USDA values are per 100g
  
  return {
    id: `usda_${usdaFood.fdcId}`,
    name: usdaFood.description,
    brand: usdaFood.brandOwner || usdaFood.brandName,
    calories_per_serving: nutrients.calories * multiplier,
    protein_per_serving: nutrients.protein * multiplier,
    carbs_per_serving: nutrients.carbs * multiplier,
    fat_per_serving: nutrients.fat * multiplier,
    fiber_per_serving: nutrients.fiber * multiplier,
    serving_size: servingSize,
    serving_unit: servingUnit,
    data_source: 'usda',
    usda_fdc_id: usdaFood.fdcId
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, pageSize = 25 } = await req.json()
    
    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ foods: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const usdaApiKey = Deno.env.get('USDA_API_KEY')
    if (!usdaApiKey) {
      throw new Error('USDA API key not configured')
    }

    // Search USDA foods - API key should be a query parameter
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}`
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        pageSize,
        dataType: ['Branded', 'Foundation', 'SR Legacy'],
        sortBy: 'score',
        sortOrder: 'desc'
      })
    })

    if (!response.ok) {
      console.error(`USDA API Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`USDA API Error: ${response.status}`)
    }

    const data = await response.json()
    
    // Normalize the foods
    const normalizedFoods = (data.foods || []).map((food: USDAFood) => 
      normalizeUSDAFood(food)
    )

    console.log(`Found ${normalizedFoods.length} foods for query: ${query}`)

    return new Response(
      JSON.stringify({ foods: normalizedFoods }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error searching USDA foods:', error)
    return new Response(
      JSON.stringify({ error: error.message, foods: [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
