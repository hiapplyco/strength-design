
import React, { useState } from "react";
import { WeatherSearch } from "@/components/workout-generator/weather/WeatherSearch";
import { WeatherDisplay } from "@/components/workout-generator/weather/WeatherDisplay";
import type { WeatherData } from "@/types/weather";

interface WeatherWidgetProps {
  data: any;
  onDataChange: (data: any) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, onDataChange }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(data?.weatherData || null);

  const handleWeatherUpdate = (newWeatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(newWeatherData);
    onDataChange({ 
      ...data, 
      weatherData: newWeatherData,
      weatherPrompt 
    });
  };

  const handleClearWeather = () => {
    setWeatherData(null);
    onDataChange({ 
      ...data, 
      weatherData: null,
      weatherPrompt: "" 
    });
  };

  return (
    <div className="h-full">
      {weatherData ? (
        <WeatherDisplay 
          weatherData={weatherData} 
          onClear={handleClearWeather} 
          numberOfDays={1}
        />
      ) : (
        <WeatherSearch 
          onWeatherUpdate={handleWeatherUpdate}
          numberOfDays={1}
        />
      )}
    </div>
  );
};
