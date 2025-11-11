import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { USDAApiService, type NormalizedFood } from '@/services/usdaApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/firebase/useAuth';

export const useEnhancedFoodSearch = (searchQuery: string, enableUSDA: boolean = true) => {
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { user } = useAuth();
  const functions = getFunctions();

  // Local food search from Firestore
  const { data: localFoods = [], isLoading: isLoadingLocal } = useQuery({
    queryKey: ['local-food-items', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      try {
        // Firestore doesn't support case-insensitive search natively
        // We'll need to fetch all food items and filter client-side
        // In production, consider using Algolia or similar for better search
        const foodsRef = collection(db, 'food_items');
        const foodsQuery = query(
          foodsRef,
          orderBy('name'),
          limit(100) // Fetch more to filter client-side
        );
        
        const snapshot = await getDocs(foodsQuery);
        const allFoods = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter client-side for case-insensitive search
        const filteredFoods = allFoods
          .filter(food => food.name?.toLowerCase().includes(debouncedQuery.toLowerCase()))
          .slice(0, 25);

        // Normalize local foods to match the interface
        return filteredFoods.map(food => ({
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
      } catch (error) {
        console.error('Error searching local foods:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2 || debouncedQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // USDA food search via Firebase Function
  const { data: usdaFoods = [], isLoading: isLoadingUSDA, error: usdaError } = useQuery({
    queryKey: ['usda-food-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      try {
        // Check if user is authenticated
        if (!user) return [];

        // Call Firebase Function to search USDA foods
        const searchUSDAFoods = httpsCallable(functions, 'searchUSDAFoods');
        const result = await searchUSDAFoods({ 
          query: debouncedQuery, 
          pageSize: 25 
        });

        const data = result.data as any;
        return data.foods || [];
      } catch (error) {
        console.error('USDA API Error:', error);
        return [];
      }
    },
    enabled: enableUSDA && debouncedQuery.length >= 2,
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