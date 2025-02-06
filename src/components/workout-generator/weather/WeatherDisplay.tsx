import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

interface WeatherDisplayProps {
  weatherData: WeatherData;
  formatTemp: (temp: number | undefined) => string;
  formatValue: (value: number | undefined, unit: string) => string;
}

export function WeatherDisplay({ weatherData, formatTemp, formatValue }: WeatherDisplayProps) {
  return (
    <div className="bg-black text-white p-4 rounded-lg shadow-sm border border-primary/30">
      <h4 className="font-medium text-lg mb-3">Current Weather in {weatherData.location}</h4>
      <div className="space-y-2">
        <p>Temperature: {formatTemp(weatherData.temperature)}</p>
        <p>Feels like: {formatTemp(weatherData.apparentTemperature)}</p>
        <p>Humidity: {formatValue(weatherData.humidity, '%')}</p>
        <p>Wind Speed: {formatValue(weatherData.windSpeed, 'km/h')}</p>
        <p>Conditions: {getWeatherDescription(weatherData.weatherCode)}</p>
      </div>
    </div>
  );
}