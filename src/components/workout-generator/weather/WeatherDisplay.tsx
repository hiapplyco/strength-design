
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
    return `${Math.round(temp)}°C`;
  };
  
  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };

  // Convert Celsius to Fahrenheit for display
  const getTempF = (tempC: number | undefined) => {
    if (tempC === undefined) return 'N/A';
    const tempF = (tempC * 9/5) + 32;
    return `${Math.round(tempF)}°F`;
  };

  const weatherDescription = getWeatherDescription(weatherData.weatherCode);

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
        <div className="flex items-center gap-2">
          <ThermometerSun className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Temperature</span>
            <span className="text-base font-medium">
              {formatTemp(weatherData.temperature)} / {getTempF(weatherData.temperature)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThermometerSun className="h-4 w-4 text-orange-400" />
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Feels like</span>
            <span className="text-base font-medium">
              {formatTemp(weatherData.apparentTemperature)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-400" />
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Humidity</span>
            <span className="text-base font-medium">{formatValue(weatherData.humidity, '%')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-sky-400" />
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Wind Speed</span>
            <span className="text-base font-medium">{formatValue(weatherData.windSpeed, 'km/h')}</span>
          </div>
        </div>
        <div className="col-span-2 mt-2 flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Conditions</span>
            <span className="text-base font-medium block">{weatherDescription}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
