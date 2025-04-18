import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Check, Info, CloudSun, Calendar } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { getWeatherDescription } from "./weather/weather-utils";
import type { ConfigurationSummaryProps, ConfigSectionProps } from "./types";
import type { WeatherData } from "@/types/weather";

function ConfigSection({ title, content, capitalize = false, icon }: ConfigSectionProps & { icon?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        {icon || <Check className="h-4 w-4 dark:text-emerald-400 light:text-emerald-600" />}
        <h4 className="font-semibold dark:text-emerald-400 light:text-emerald-600 text-base">{title}</h4>
      </div>
      <p className={`text-sm dark:text-white/80 light:text-gray-700 pl-6 ${capitalize ? 'capitalize' : ''}`}>
        {content}
      </p>
    </div>
  );
}

export function ConfigurationSummary({
  numberOfDays,
  numberOfCycles,
  fitnessLevel,
  selectedExercises,
  prescribedExercises,
  injuries,
  weatherData,
  maxHeight = "40vh"
}: ConfigurationSummaryProps & { maxHeight?: string }) {
  const isWeatherDataObject = (data: any): data is WeatherData => {
    return data && typeof data === 'object' && 'location' in data;
  };

  const getWeatherDisplay = () => {
    if (!weatherData) return null;
    
    if (isWeatherDataObject(weatherData)) {
      const tempF = Math.round((weatherData.temperature * 9/5) + 32);
      const description = getWeatherDescription(weatherData.weatherCode);
      return `${description} in ${weatherData.location}, ${Math.round(weatherData.temperature)}°C (${tempF}°F), ${weatherData.humidity}% humidity`;
    }
    
    return typeof weatherData === 'string' ? weatherData : 'Weather data available';
  };

  const getForecastDisplay = () => {
    if (!weatherData || !isWeatherDataObject(weatherData) || !weatherData.forecast) return null;
    
    const forecast = weatherData.forecast;
    // Only display forecast for the number of days selected for the workout
    const limitedDays = Math.min(numberOfDays, forecast.dates.length);
    
    if (limitedDays <= 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {Array.from({ length: limitedDays }).map((_, index) => {
          if (index >= forecast.dates.length) return null;
          
          const date = new Date(forecast.dates[index]);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const description = getWeatherDescription(forecast.weatherCodes[index]);
          const maxTemp = Math.round(forecast.maxTemps[index]);
          const minTemp = Math.round(forecast.minTemps[index]);
          const maxTempF = Math.round((forecast.maxTemps[index] * 9/5) + 32);
          const minTempF = Math.round((forecast.minTemps[index] * 9/5) + 32);
          const precipProb = forecast.precipitationProb[index];
          
          return (
            <div key={index} className="text-sm pl-2 border-l dark:border-emerald-500/30 light:border-emerald-500/70">
              <div className="flex items-center gap-1 dark:text-emerald-400 light:text-emerald-600 font-medium">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate} {index === 0 ? '(Today)' : ''}</span>
              </div>
              <div className="pl-4 dark:text-white/80 light:text-gray-700">
                <div>{description}</div>
                <div>Temp: {minTemp}-{maxTemp}°C ({minTempF}-{maxTempF}°F)</div>
                <div>Precipitation: {precipProb}%</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const hasAnyConfig = numberOfDays > 0 || fitnessLevel || selectedExercises.length > 0 || 
                      prescribedExercises || injuries || weatherData;

  return (
    <Card className="dark:bg-black/30 light:bg-white/80 dark:border-emerald-500/30 light:border-emerald-500/50 shadow-md">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-base dark:text-emerald-400 light:text-emerald-600 font-medium tracking-wide flex items-center gap-2">
          <Info className="h-4 w-4" />
          Your Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        {!hasAnyConfig ? (
          <div className="text-center py-4 dark:text-white/60 light:text-gray-500">
            <p>No configuration settings yet.</p>
            <p className="text-sm mt-1">Use the options above to customize your workout.</p>
          </div>
        ) : (
          <ScrollArea className={`h-[${maxHeight}] rounded-md border dark:border-emerald-500/20 light:border-emerald-500/30 dark:bg-black/40 light:bg-gray-50/50 p-3 pr-6 overflow-hidden`} style={{ maxHeight: maxHeight }}>
            <div className="pr-2 pb-2">
              <ConfigSection 
                title="Training Schedule"
                content={`${numberOfCycles} ${numberOfCycles > 1 ? 'cycles' : 'cycle'} of ${numberOfDays} ${numberOfDays > 1 ? 'days' : 'day'} each`}
              />
              
              {fitnessLevel && (
                <ConfigSection 
                  title="Fitness Level"
                  content={fitnessLevel}
                  capitalize={true}
                />
              )}
              
              {selectedExercises.length > 0 && (
                <ConfigSection 
                  title="Selected Exercises/Equipment"
                  content={selectedExercises.map(ex => ex.name).join(', ')}
                />
              )}
              
              {prescribedExercises && (
                <ConfigSection 
                  title="Your Goals"
                  content={prescribedExercises}
                />
              )}
              
              {injuries && (
                <ConfigSection 
                  title="Injuries & Limitations"
                  content={injuries}
                />
              )}
              
              {weatherData && getWeatherDisplay() && (
                <ConfigSection 
                  title="Weather Conditions"
                  content={getWeatherDisplay() || ''}
                  icon={<CloudSun className="h-4 w-4 dark:text-emerald-400 light:text-emerald-600" />}
                />
              )}
              
              {getForecastDisplay()}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
