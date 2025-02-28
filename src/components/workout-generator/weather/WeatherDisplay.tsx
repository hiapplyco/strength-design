
import { X, CloudSun, Droplets, Wind, ThermometerSun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeatherDescription } from "./weather-utils";
import { Separator } from "@/components/ui/separator";
import type { WeatherData } from "@/types/weather";

interface WeatherDisplayProps {
  weatherData: WeatherData;
  onClear: () => void;
  numberOfDays?: number;
}

export function WeatherDisplay({ weatherData, onClear, numberOfDays = 1 }: WeatherDisplayProps) {
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

  const renderForecast = () => {
    if (!weatherData.forecast) return null;
    
    // Only display forecast for the number of days selected (skip today if it's included in the forecast)
    const forecastDays = Math.min(
      numberOfDays > 1 ? numberOfDays - 1 : 0, 
      weatherData.forecast.dates.length - 1
    );
    
    if (forecastDays <= 0) return null;
    
    return (
      <>
        <Separator className="my-3 bg-primary/20" />
        <div className="mb-2">
          <h4 className="text-sm font-medium text-primary flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Forecast for Workout Days
          </h4>
        </div>
        <div className="space-y-3">
          {Array.from({ length: forecastDays }).map((_, index) => {
            // Start from index 1 to skip today
            const i = index + 1;
            if (i >= weatherData.forecast?.dates.length) return null;
            
            const date = new Date(weatherData.forecast.dates[i]);
            const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const description = getWeatherDescription(weatherData.forecast.weatherCodes[i]);
            const maxTemp = Math.round(weatherData.forecast.maxTemps[i]);
            const minTemp = Math.round(weatherData.forecast.minTemps[i]);
            const maxTempF = Math.round((weatherData.forecast.maxTemps[i] * 9/5) + 32);
            const minTempF = Math.round((weatherData.forecast.minTemps[i] * 9/5) + 32);
            
            return (
              <div key={i} className="bg-black/30 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs">{formattedDate}</span>
                  <span className="text-xs text-white/60">
                    {weatherData.forecast.precipitationProb[i]}% precipitation
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm">{description}</span>
                  <span className="text-xs">
                    {minTemp}-{maxTemp}°C ({minTempF}-{maxTempF}°F)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
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
      
      {renderForecast()}
    </div>
  );
}
