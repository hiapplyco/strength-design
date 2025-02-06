import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

interface WeatherForecastProps {
  forecast: NonNullable<WeatherData['forecast']>;
  formatTemp: (temp: number | undefined) => string;
  formatValue: (value: number | undefined, unit: string) => string;
}

export function WeatherForecast({ forecast, formatTemp, formatValue }: WeatherForecastProps) {
  return (
    <div className="bg-black text-white p-4 rounded-lg shadow-sm border border-primary/30">
      <h4 className="font-medium text-lg mb-3">Forecast</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        {forecast.dates.map((date, index) => (
          <div key={date} className="p-2 bg-black/50 rounded-md text-sm border border-primary/20">
            <p className="font-medium">{new Date(date).toLocaleDateString(undefined, {
              weekday: 'short',
              day: 'numeric'
            })}</p>
            <div className="space-y-0.5">
              <p>{formatTemp(forecast.maxTemps[index]).split(' ')[0]}</p>
              <p className="text-gray-300 text-xs">{getWeatherDescription(forecast.weatherCodes[index])}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}