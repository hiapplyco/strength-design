import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";
import { Loader2 } from "lucide-react";

interface WeatherDisplayProps {
  weatherData: WeatherData;
  formatTemp: (temp: number | undefined) => string;
  formatValue: (value: number | undefined, unit: string) => string;
  isLoading?: boolean;
}

export function WeatherDisplay({ 
  weatherData, 
  formatTemp, 
  formatValue,
  isLoading = false 
}: WeatherDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-primary/10 rounded-xl animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-primary font-medium">Loading weather data...</span>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 p-6 rounded-xl space-y-4">
      <h3 className="text-xl font-oswald">Current Weather in {weatherData.location}</h3>
      <div className="grid gap-4">
        <div>
          <p className="text-lg">{getWeatherDescription(weatherData.weatherCode)}</p>
          <p className="text-2xl font-bold">{formatTemp(weatherData.temperature)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Feels Like</p>
            <p>{formatTemp(weatherData.apparentTemperature)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Humidity</p>
            <p>{formatValue(weatherData.humidity, '%')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Wind Speed</p>
            <p>{formatValue(weatherData.windSpeed, 'km/h')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Wind Gusts</p>
            <p>{formatValue(weatherData.windGusts, 'km/h')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}