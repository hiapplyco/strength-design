
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { searchLocations } from '@/components/workout-generator/weather/weather-utils';
import type { LocationResult } from '@/components/workout-generator/weather/types';

export const useEnhancedWeatherSearch = (searchQuery: string) => {
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['weather-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      console.log('Searching locations for:', debouncedQuery);

      try {
        const results = await searchLocations(debouncedQuery);
        console.log('Location search results:', results.length);
        return results;
      } catch (error) {
        console.error('Failed to search locations:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2 || debouncedQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return {
    locations,
    isLoading,
    hasError: !!error,
    locationCount: locations.length
  };
};
