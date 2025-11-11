
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CloudSun, X } from 'lucide-react';
import { EnhancedWeatherSearch } from '../../weather/EnhancedWeatherSearch';
import { ModernInputCard } from '../components/ModernInputCard';
import type { WeatherData } from '@/types/weather';

interface ModernWeatherCardProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  numberOfDays: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ModernWeatherCard: React.FC<ModernWeatherCardProps> = ({
  weatherData,
  onWeatherUpdate,
  numberOfDays,
  isExpanded,
  onToggle
}) => {
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  const getPreview = () => {
    if (!weatherData) return undefined;
    return `${weatherData.location} • ${weatherData.temperature}°C`;
  };

  return (
    <ModernInputCard
      icon={<CloudSun className="h-5 w-5" />}
      title="Weather Conditions"
      isExpanded={isExpanded}
      onToggle={onToggle}
      hasContent={!!weatherData}
      preview={getPreview()}
    >
      <div className="space-y-4">
        {weatherData ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Weather-optimized workout recommendations
            </p>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                  {weatherData.location}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearWeather}
                  className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span>{weatherData.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidity:</span>
                  <span>{weatherData.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wind:</span>
                  <span>{weatherData.windSpeed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rain:</span>
                  <span>{weatherData.precipitation}mm</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add your location to get weather-optimized workout recommendations
            </p>
            <EnhancedWeatherSearch 
              onWeatherUpdate={onWeatherUpdate}
              numberOfDays={numberOfDays}
            />
          </div>
        )}
      </div>
    </ModernInputCard>
  );
};
