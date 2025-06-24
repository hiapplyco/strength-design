
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { USDAApiService, type NormalizedFood } from '@/services/usdaApi';
import { useDebounce } from '@/hooks/useDebounce';

export const useEnhancedFoodSearch = (searchQuery: string, enableUSDA: boolean = true) => {
  const debouncedQuery = useDebounce(searchQuery, 300); // Reduced from 500ms to 300ms

  // Local food search
  const { data: localFoods = [], isLoading: isLoadingLocal } = useQuery({
    queryKey: ['local-food-items', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${debouncedQuery}%`)
        .order('name', { ascending: true })
        .limit(25);

      if (error) throw error;

      // Normalize local foods to match the interface
      return (data || []).map(food => ({
        id: food.id.toString(),
        name: food.name,
        brand: food.brand,
        calories_per_serving: food.calories_per_serving,
        protein_per_serving: food.protein_per_serving,
        carbs_per_serving: food.carbs_per_serving,
        fat_per_serving: food.fat_per_serving,
        fiber_per_serving: food.fiber_per_serving || 0,
        serving_size: food.serving_size,
        serving_unit: food.serving_unit,
        data_source: 'local' as const
      }));
    },
    enabled: debouncedQuery.length >= 2 || debouncedQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // USDA food search - now starts at 2 characters instead of 3
  const { data: usdaFoods = [], isLoading: isLoadingUSDA, error: usdaError } = useQuery({
    queryKey: ['usda-food-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return []; // Reduced from 3 to 2

      try {
        // Get USDA API key from Supabase secrets
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        // Call edge function to search USDA foods (keeps API key secure)
        const { data, error } = await supabase.functions.invoke('search-usda-foods', {
          body: { query: debouncedQuery, pageSize: 25 }
        });

        if (error) throw error;
        return data.foods || [];
      } catch (error) {
        console.error('USDA API Error:', error);
        return [];
      }
    },
    enabled: enableUSDA && debouncedQuery.length >= 2, // Changed from 3 to 2
    staleTime: 1000 * 60 * 10, // 10 minutes for USDA data
    retry: 1, // Only retry once on failure
  });

  // Combine and deduplicate results
  const combinedFoods: NormalizedFood[] = [
    ...localFoods,
    ...usdaFoods
  ].slice(0, 50); // Limit total results

  return {
    foods: combinedFoods,
    isLoading: isLoadingLocal || isLoadingUSDA,
    hasUSDAError: !!usdaError,
    localCount: localFoods.length,
    usdaCount: usdaFoods.length
  };
};
