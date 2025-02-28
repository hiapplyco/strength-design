
import { X, CloudSun, Droplets, Wind, ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeatherDescription } from "./weather-utils";
import type { WeatherData } from "@/types/weather";

interface WeatherDisplayProps {
  weatherData: WeatherData;
  onClear: () => void;
}

export function WeatherDisplay({ weatherData, onClear }: WeatherDisplayProps) {
  if (!weatherData) return null;
  
  const formatTemp = (temp: number | undefined) => {
    if (temp === undefined) return 'N/A';
    return `${temp}°C`;
  };
  
  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${value}${unit}`;
  };

  return (
    <div className="bg-black/40 text-white p-4 rounded-sm shadow-md border border-primary/30">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-lg text-primary">{weatherData.location}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear} 
          className="h-8 w-8 p-0 rounded-sm hover:bg-primary/20"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear weather data</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex flex-col">
          <span className="text-xs text-white/60">Temperature</span>
          <span className="text-base font-medium">{formatTemp(weatherData.temperature)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-white/60">Feels like</span>
          <span className="text-base font-medium">{formatTemp(weatherData.apparentTemperature)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-white/60">Humidity</span>
          <span className="text-base font-medium">{formatValue(weatherData.humidity, '%')}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-white/60">Wind Speed</span>
          <span className="text-base font-medium">{formatValue(weatherData.windSpeed, 'km/h')}</span>
        </div>
        <div className="col-span-2 mt-2">
          <span className="text-xs text-white/60">Conditions</span>
          <span className="text-base font-medium block">{getWeatherDescription(weatherData.weatherCode)}</span>
        </div>
      </div>
    </div>
  );
}
