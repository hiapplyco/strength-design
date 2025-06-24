
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useEnhancedWeatherSearch } from '@/hooks/useEnhancedWeatherSearch';
import { fetchWeatherData, getWeatherDescription } from './weather-utils';
import type { LocationResult } from './types';
import type { WeatherData } from '@/types/weather';

interface LiveWeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  numberOfDays?: number;
  onSearchStateChange?: (searching: boolean) => void;
}

export const LiveWeatherSearch: React.FC<LiveWeatherSearchProps> = ({
  onWeatherUpdate,
  numberOfDays = 7,
  onSearchStateChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const { locations, isLoading } = useEnhancedWeatherSearch(searchQuery);

  const handleLocationSelect = async (location: LocationResult) => {
    setIsLoadingWeather(true);
    
    try {
      const weatherData = await fetchWeatherData(
        location.latitude,
        location.longitude,
        location.name,
        numberOfDays
      );
      
      // Generate a simple weather prompt based on the data
      const weatherPrompt = `Consider the weather in ${location.name}: ${weatherData.temperature}°C, 
        ${weatherData.weatherCode ? getWeatherDescription(weatherData.weatherCode) : 'varied conditions'}, 
        with humidity at ${weatherData.humidity}% and wind speed of ${weatherData.windSpeed} km/h.`;
        
      onWeatherUpdate(weatherData, weatherPrompt);
      setSearchQuery(''); // Clear search after selection
      onSearchStateChange?.(false); // Notify parent that search is done
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const shouldShowResults = searchQuery.length >= 2 && !isLoadingWeather;

  // Notify parent when search state changes
  useEffect(() => {
    onSearchStateChange?.(shouldShowResults);
  }, [shouldShowResults, onSearchStateChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Weather Location</span>
      </div>
      
      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for weather location..."
            value={searchQuery}
            onChange={handleInputChange}
            className="pl-10 h-[48px] bg-background border-2 border-border hover:border-primary/50 rounded-lg transition-all duration-200"
            disabled={isLoadingWeather}
          />
          {(isLoading || isLoadingWeather) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Live search results - now positioned in normal flow */}
        {shouldShowResults && (
          <div className="bg-background border-2 border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {locations.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No locations found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {locations.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-sm font-medium">Locations</span>
                    <Badge variant="secondary" className="text-xs">
                      {locations.length} found
                    </Badge>
                  </div>
                )}
                {locations.map((location, index) => (
                  <Button
                    key={`${location.latitude}-${location.longitude}-${index}`}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-muted/50"
                    onClick={() => handleLocationSelect(location)}
                    disabled={isLoadingWeather}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {location.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {location.country}
                          {location.admin1 && `, ${location.admin1}`}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Add weather conditions to optimize your workout for the current environment
      </p>
    </div>
  );
};
