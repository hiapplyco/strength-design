
import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

interface WeatherDisplayProps {
  weather?: WeatherData;
  weatherData?: WeatherData;
  onClear: () => void;
}

export function WeatherDisplay({ weather, weatherData, onClear }: WeatherDisplayProps) {
  // Use either weather or weatherData prop, prioritizing weather
  const data = weather || weatherData;
  
  if (!data) return null;
  
  const formatTemp = (temp: number | undefined) => {
    if (temp === undefined) return 'N/A';
    return `${temp}°C`;
  };
  
  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${value}${unit}`;
  };

  return (
    <div className="bg-black text-white p-4 rounded-lg shadow-sm border border-primary/30">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-lg">Current Weather in {data.location}</h4>
        <button 
          onClick={onClear}
          className="text-xs text-primary hover:text-primary/80"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        <p>Temperature: {formatTemp(data.temperature)}</p>
        <p>Feels like: {formatTemp(data.apparentTemperature)}</p>
        <p>Humidity: {formatValue(data.humidity, '%')}</p>
        <p>Wind Speed: {formatValue(data.windSpeed, 'km/h')}</p>
        <p>Conditions: {getWeatherDescription(data.weatherCode)}</p>
      </div>
    </div>
  );
}
