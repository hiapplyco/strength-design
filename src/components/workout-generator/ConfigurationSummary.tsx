import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Check, Info, CloudSun } from "lucide-react";
import type { ConfigurationSummaryProps, ConfigSectionProps } from "./types";
import type { WeatherData } from "@/types/weather";
import { getWeatherDescription } from "./weather-utils";

function ConfigSection({ title, content, capitalize = false, icon }: ConfigSectionProps & { icon?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        {icon || <Check className="h-4 w-4 text-primary" />}
        <h4 className="font-semibold text-primary text-base">{title}</h4>
      </div>
      <p className={`text-sm text-white/80 pl-6 ${capitalize ? 'capitalize' : ''}`}>
        {content}
      </p>
    </div>
  );
}

export function ConfigurationSummary({
  numberOfDays,
  fitnessLevel,
  selectedExercises,
  prescribedExercises,
  injuries,
  weatherData,
  maxHeight = "40vh"
}: ConfigurationSummaryProps & { maxHeight?: string }) {
  // Function to check if weatherData is a WeatherData object
  const isWeatherDataObject = (data: any): data is WeatherData => {
    return data && typeof data === 'object' && 'location' in data;
  };

  // Format weather data for display
  const getWeatherDisplay = () => {
    if (!weatherData) return null;
    
    if (isWeatherDataObject(weatherData)) {
      const tempF = Math.round((weatherData.temperature * 9/5) + 32);
      const description = getWeatherDescription(weatherData.weatherCode);
      return `${description} in ${weatherData.location}, ${Math.round(weatherData.temperature)}°C (${tempF}°F), ${weatherData.humidity}% humidity`;
    }
    
    return typeof weatherData === 'string' ? weatherData : 'Weather data available';
  };

  const hasAnyConfig = numberOfDays > 0 || fitnessLevel || selectedExercises.length > 0 || 
                      prescribedExercises || injuries || weatherData;

  return (
    <Card className="bg-black/30 border-primary/30 shadow-md">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-base text-primary font-oswald tracking-wide flex items-center gap-2">
          <Info className="h-4 w-4" />
          Your Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        {!hasAnyConfig ? (
          <div className="text-center py-4 text-white/60">
            <p>No configuration settings yet.</p>
            <p className="text-sm mt-1">Use the options above to customize your workout.</p>
          </div>
        ) : (
          <ScrollArea className={`h-[${maxHeight}] rounded-md border border-primary/20 bg-black/40 p-3 pr-6 overflow-hidden`} style={{ maxHeight: maxHeight }}>
            <div className="pr-2 pb-2">
              {numberOfDays > 0 && (
                <ConfigSection 
                  title="Training Days"
                  content={`${numberOfDays} day${numberOfDays > 1 ? 's' : ''} of training`}
                />
              )}
              
              {fitnessLevel && (
                <ConfigSection 
                  title="Fitness Level"
                  content={fitnessLevel}
                  capitalize
                />
              )}

              {selectedExercises.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-primary text-base">Selected Exercises</h4>
                  </div>
                  <div className="pl-6 flex flex-wrap gap-2">
                    {selectedExercises.map((exercise, index) => (
                      <Badge key={index} variant="outline" className="bg-black/50">
                        {exercise.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {prescribedExercises && (
                <ConfigSection 
                  title="Prescribed Exercises"
                  content={prescribedExercises}
                />
              )}

              {injuries && (
                <ConfigSection 
                  title="Health Considerations"
                  content={injuries}
                />
              )}

              {weatherData && getWeatherDisplay() && (
                <ConfigSection 
                  title="Weather Conditions"
                  content={getWeatherDisplay() || "Weather data available for workout optimization"}
                  icon={<CloudSun className="h-4 w-4 text-yellow-400" />}
                />
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
