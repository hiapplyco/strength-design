
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CloudSun, MessageSquare, X } from 'lucide-react';
import { EnhancedWeatherSearch } from '../../weather/EnhancedWeatherSearch';
import { WeatherDisplay } from '../../weather/WeatherDisplay';
import type { WeatherData } from '@/types/weather';

interface WeatherCardProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  numberOfDays: number;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weatherData,
  onWeatherUpdate,
  numberOfDays
}) => {
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  return (
    <Card className={`transition-colors duration-300 ${weatherData ? 'border-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudSun className="h-4 w-4 text-primary" />
          Weather Conditions
          {weatherData && <MessageSquare className="h-3 w-3 text-primary opacity-60" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weatherData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
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
            <div className="text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-2">
                <div>Temperature: {weatherData.temperature}°C</div>
                <div>Humidity: {weatherData.humidity}%</div>
                <div>Wind: {weatherData.windSpeed} km/h</div>
                <div>Precipitation: {weatherData.precipitation}mm</div>
              </div>
            </div>
          </div>
        ) : (
          <EnhancedWeatherSearch 
            onWeatherUpdate={onWeatherUpdate}
            numberOfDays={numberOfDays}
          />
        )}
      </CardContent>
    </Card>
  );
};
