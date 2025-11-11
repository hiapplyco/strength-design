
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useEnhancedWeatherSearch } from '@/hooks/useEnhancedWeatherSearch';
import { EnhancedWeatherSearchResults } from './EnhancedWeatherSearchResults';
import { fetchWeatherData, getWeatherDescription } from './weather-utils';
import type { LocationResult } from './types';
import type { WeatherData } from '@/types/weather';

interface EnhancedWeatherSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  numberOfDays?: number;
}

export const EnhancedWeatherSearchDialog: React.FC<EnhancedWeatherSearchDialogProps> = ({
  isOpen,
  onClose,
  onWeatherUpdate,
  numberOfDays = 7
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
      onClose();
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Handle error but don't break the flow
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Weather Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a city or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          
          <div className="border rounded-lg bg-background min-h-[200px]">
            <EnhancedWeatherSearchResults
              locations={locations}
              isLoading={isLoading || isLoadingWeather}
              searchQuery={searchQuery}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
