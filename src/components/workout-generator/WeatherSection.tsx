import { useState } from "react";
import type { WeatherData } from "@/types/weather";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { WeatherForecast } from "./weather/WeatherForecast";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function WeatherSection({ weatherData, onWeatherUpdate, renderTooltip }: WeatherSectionProps) {
  const formatTemp = (temp: number | undefined) => {
    if (temp === undefined) return 'N/A';
    const fahrenheit = (temp * 9/5) + 32;
    return `${fahrenheit.toFixed(1)}°F (${temp}°C)`;
  };

  const formatValue = (value: number | undefined, unit: string) => {
    return value !== undefined ? `${value}${unit}` : 'N/A';
  };

  return (
    <div className="space-y-4">
      <WeatherSearch 
        onWeatherUpdate={onWeatherUpdate}
        renderTooltip={renderTooltip}
      />

      {weatherData && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeatherDisplay 
              weatherData={weatherData}
              formatTemp={formatTemp}
              formatValue={formatValue}
            />

            {weatherData.forecast && (
              <WeatherForecast 
                forecast={weatherData.forecast}
                formatTemp={formatTemp}
                formatValue={formatValue}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}