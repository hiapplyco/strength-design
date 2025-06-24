
import { X, CloudSun, Droplets, Wind, ThermometerSun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeatherDescription } from "./weather-utils";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeatherData } from "@/types/weather";
import { cn } from "@/lib/utils";
import { sizes, spacing, typography, radius } from "@/lib/design-tokens";

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

  const getTempF = (tempC: number | undefined) => {
    if (tempC === undefined) return 'N/A';
    const tempF = (tempC * 9/5) + 32;
    return `${Math.round(tempF)}°F`;
  };

  const weatherDescription = getWeatherDescription(weatherData.weatherCode);

  const renderForecast = () => {
    if (!weatherData.forecast) return null;
    
    const forecastDays = Math.min(
      numberOfDays > 1 ? numberOfDays - 1 : 0, 
      weatherData.forecast.dates.length - 1
    );
    
    if (forecastDays <= 0) return null;
    
    return (
      <>
        <Separator className={spacing.margin.element} />
        <div className={spacing.margin.text}>
          <h4 className={cn(typography.label, "flex items-center gap-2")}>
            <Calendar className={sizes.icon.xs} />
            Forecast for Workout Days
          </h4>
        </div>
        <div className={spacing.gap.sm}>
          {Array.from({ length: forecastDays }).map((_, index) => {
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
              <Card 
                key={i} 
                variant="ghost" 
                className={cn(spacing.component.xs, "bg-muted/50")}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(typography.caption, "font-medium")}>{formattedDate}</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {weatherData.forecast.precipitationProb[i]}% rain
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={typography.body.small}>{description}</span>
                  <span className={typography.caption}>
                    {minTemp}-{maxTemp}°C ({minTempF}-{maxTempF}°F)
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className={spacing.gap.md}>
      <div className="flex justify-between items-start">
        <h4 className={typography.display.h6}>{weatherData.location}</h4>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClear} 
          className={sizes.touch.iconButton}
        >
          <X className={sizes.icon.sm} />
          <span className="sr-only">Clear weather data</span>
        </Button>
      </div>

      <div className={cn("grid grid-cols-2", spacing.gap.md)}>
        <div className={cn("flex items-center", spacing.gap.xs)}>
          <ThermometerSun className={cn(sizes.icon.sm, "text-primary")} />
          <div className="flex flex-col">
            <span className={typography.caption}>Temperature</span>
            <span className={cn(typography.body.default, "font-medium")}>
              {formatTemp(weatherData.temperature)} / {getTempF(weatherData.temperature)}
            </span>
          </div>
        </div>
        <div className={cn("flex items-center", spacing.gap.xs)}>
          <ThermometerSun className={cn(sizes.icon.sm, "text-primary")} />
          <div className="flex flex-col">
            <span className={typography.caption}>Feels like</span>
            <span className={cn(typography.body.default, "font-medium")}>
              {formatTemp(weatherData.apparentTemperature)}
            </span>
          </div>
        </div>
        <div className={cn("flex items-center", spacing.gap.xs)}>
          <Droplets className={cn(sizes.icon.sm, "text-primary")} />
          <div className="flex flex-col">
            <span className={typography.caption}>Humidity</span>
            <span className={cn(typography.body.default, "font-medium")}>
              {formatValue(weatherData.humidity, '%')}
            </span>
          </div>
        </div>
        <div className={cn("flex items-center", spacing.gap.xs)}>
          <Wind className={cn(sizes.icon.sm, "text-primary")} />
          <div className="flex flex-col">
            <span className={typography.caption}>Wind Speed</span>
            <span className={cn(typography.body.default, "font-medium")}>
              {formatValue(weatherData.windSpeed, 'km/h')}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("flex items-center", spacing.gap.xs)}>
        <CloudSun className={cn(sizes.icon.sm, "text-primary")} />
        <div className="flex flex-col">
          <span className={typography.caption}>Conditions</span>
          <span className={cn(typography.body.default, "font-medium")}>
            {weatherDescription}
          </span>
        </div>
      </div>
      
      {renderForecast()}
    </div>
  );
}
