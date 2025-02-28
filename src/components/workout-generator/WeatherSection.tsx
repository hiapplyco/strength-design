
import React from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import type { WeatherData } from "@/types/weather";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
}

export function WeatherSection({ 
  weatherData, 
  onWeatherUpdate,
  renderTooltip
}: WeatherSectionProps) {
  return (
    <div className="space-y-4">
      <WeatherSearch 
        onWeatherUpdate={onWeatherUpdate} 
        renderTooltip={renderTooltip}
      />
    </div>
  );
}
