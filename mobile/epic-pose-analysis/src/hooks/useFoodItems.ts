
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFoodItems = (searchQuery: string) => {
  const { data: foodItems = [], isLoading } = useQuery({
    queryKey: ['food-items', searchQuery],
    queryFn: async () => {
      let query = supabase.from('food_items').select('*');
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query
        .order('name', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.length >= 2 || searchQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    foodItems,
    isLoading
  };
};
