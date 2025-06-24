
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import type { Exercise } from '@/components/exercise-search/types';

export const useEnhancedExerciseSearch = (searchQuery: string) => {
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: exercises = [], isLoading, error } = useQuery({
    queryKey: ['exercise-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      console.log('Searching exercises for:', debouncedQuery);

      try {
        const { data, error } = await supabase.functions.invoke('search-exercises', {
          body: { query: debouncedQuery }
        });

        if (error) {
          console.error('Exercise search error:', error);
          throw error;
        }

        console.log('Exercise search results:', data?.results?.length || 0);
        return data?.results || [];
      } catch (error) {
        console.error('Failed to search exercises:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2 || debouncedQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return {
    exercises,
    isLoading,
    hasError: !!error,
    exerciseCount: exercises.length
  };
};
