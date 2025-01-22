import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

interface WeatherDisplayProps {
  weatherData: WeatherData;
  formatTemp: (temp: number | undefined) => string;
  formatValue: (value: number | undefined, unit: string) => string;
}

export function WeatherDisplay({ weatherData, formatTemp, formatValue }: WeatherDisplayProps) {
  return (
    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
      <h4 className="font-medium text-lg mb-3">Current Weather in {weatherData.location}</h4>
      <div className="space-y-2">
        <p>Temperature: {formatTemp(weatherData.temperature)}</p>
        <p>Feels like: {formatTemp(weatherData.apparentTemperature)}</p>
        <p>Humidity: {formatValue(weatherData.humidity, '%')}</p>
        <p>Wind Speed: {formatValue(weatherData.windSpeed, ' km/h')}</p>
        <p>Wind Direction: {formatValue(weatherData.windDirection, '°')}</p>
        <p>Wind Gusts: {formatValue(weatherData.windGusts, ' km/h')}</p>
        <p>Conditions: {getWeatherDescription(weatherData.weatherCode)}</p>
      </div>
    </div>
  );
}