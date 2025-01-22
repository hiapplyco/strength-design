import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

interface WeatherForecastProps {
  forecast: NonNullable<WeatherData['forecast']>;
  formatTemp: (temp: number | undefined) => string;
  formatValue: (value: number | undefined, unit: string) => string;
}

export function WeatherForecast({ forecast, formatTemp, formatValue }: WeatherForecastProps) {
  return (
    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
      <h4 className="font-medium text-lg mb-3">Forecast</h4>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {forecast.dates.map((date, index) => (
          <div key={date} className="p-3 bg-background/80 rounded-md">
            <p className="font-medium">{new Date(date).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}</p>
            <div className="mt-1 space-y-1 text-sm">
              <p>High: {formatTemp(forecast.maxTemps[index])}</p>
              <p>Low: {formatTemp(forecast.minTemps[index])}</p>
              <p>Precipitation: {formatValue(forecast.precipitationProb[index], '%')}</p>
              <p>Conditions: {getWeatherDescription(forecast.weatherCodes[index])}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}