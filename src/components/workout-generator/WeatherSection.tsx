
import React from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloudSun } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather/weather-utils";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
  numberOfDays?: number;
}

export function WeatherSection({ 
  weatherData, 
  onWeatherUpdate,
  renderTooltip,
  numberOfDays = 7
}: WeatherSectionProps) {
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  const handleWeatherDataUpdate = (newWeatherData: WeatherData | null) => {
    if (!newWeatherData) {
      onWeatherUpdate(null, "");
      return;
    }

    // Create a detailed weather prompt for the current conditions
    const tempF = Math.round((newWeatherData.temperature * 9/5) + 32);
    const weatherDescription = getWeatherDescription(newWeatherData.weatherCode);
    
    let weatherPrompt = `Consider the current weather in ${newWeatherData.location}: ${weatherDescription}, temperature of ${Math.round(newWeatherData.temperature)}°C (${tempF}°F), ${newWeatherData.humidity}% humidity, and wind speed of ${Math.round(newWeatherData.windSpeed)} km/h.`;
    
    // Add forecast data if available
    if (newWeatherData.forecast && numberOfDays > 1) {
      weatherPrompt += "\n\nForecast for workout days:";
      
      // Only include forecast for the number of days in the workout plan
      const daysToInclude = Math.min(numberOfDays, newWeatherData.forecast.dates.length);
      
      for (let i = 0; i < daysToInclude; i++) {
        const date = new Date(newWeatherData.forecast.dates[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const description = getWeatherDescription(newWeatherData.forecast.weatherCodes[i]);
        const maxTemp = Math.round(newWeatherData.forecast.maxTemps[i]);
        const minTemp = Math.round(newWeatherData.forecast.minTemps[i]);
        const precipProb = newWeatherData.forecast.precipitationProb[i];
        
        weatherPrompt += `\n- ${dayName}: ${description}, temperature ${minTemp}-${maxTemp}°C, ${precipProb}% chance of precipitation.`;
      }
    }
    
    weatherPrompt += "\n\nWeather conditions may affect workout intensity, hydration needs, and exercise selection.";
    
    onWeatherUpdate(newWeatherData, weatherPrompt);
  };

  return (
    <div className="w-full">
      {weatherData ? (
        <Card className="bg-black/20 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 w-full">
          <CardHeader className="flex flex-row items-center pb-2">
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" />
              <h3 className="font-oswald text-lg">Weather Conditions</h3>
              {renderTooltip && renderTooltip()}
            </div>
          </CardHeader>
          <CardContent>
            <WeatherDisplay 
              weatherData={weatherData} 
              onClear={handleClearWeather}
              numberOfDays={numberOfDays}
            />
          </CardContent>
        </Card>
      ) : (
        <WeatherSearch 
          onWeatherUpdate={handleWeatherDataUpdate}
          renderTooltip={renderTooltip}
          numberOfDays={numberOfDays}
        />
      )}
    </div>
  );
}
