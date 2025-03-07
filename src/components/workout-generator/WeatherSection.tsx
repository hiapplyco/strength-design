
import React, { useState } from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloudSun, ChevronDown, ChevronUp } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather/weather-utils";
import { TooltipWrapper } from "./TooltipWrapper";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    <div className="space-y-4">
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-3 rounded-md relative",
          "bg-black/20 hover:bg-black/30 transition-colors duration-200",
          "bg-gradient-to-r from-[#0e401a]/30 via-[#3b0f47]/30 to-[#4a0924]/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-10 rounded-md"></div>
        <CloudSun className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg text-white">Add Weather Conditions</h3>
        {renderTooltip ? renderTooltip() : <TooltipWrapper content="Add local weather conditions to optimize your workout for the current environment" />}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden relative rounded-md p-4 pl-6"
          >
            <div className="absolute inset-0 bg-black/10 rounded-md"></div>
            <div className="absolute inset-0 rounded-md p-[1px] -z-10 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70"></div>
            
            <div className="relative z-10 pt-2">
              {weatherData ? (
                <WeatherDisplay 
                  weatherData={weatherData} 
                  onClear={handleClearWeather}
                  numberOfDays={numberOfDays}
                />
              ) : (
                <WeatherSearch 
                  onWeatherUpdate={handleWeatherDataUpdate}
                  renderTooltip={renderTooltip}
                  numberOfDays={numberOfDays}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
