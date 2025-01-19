import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X } from "lucide-react";
import { LocationSearch } from "./LocationSearch";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (value: boolean) => void;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
}: GenerateWorkoutInputProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const handleLocationSelect = async (location: { 
    name: string; 
    latitude: number; 
    longitude: number;
    admin1?: string;
    country: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { 
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      if (error) throw error;

      const locationString = [
        location.name,
        location.admin1,
        location.country
      ].filter(Boolean).join(", ");

      setWeatherData({
        temperature: data.weather.current.temperature_2m,
        humidity: data.weather.current.relative_humidity_2m,
        windSpeed: data.weather.current.wind_speed_10m,
        location: locationString
      });

      // Update the generate prompt with weather information
      const weatherPrompt = `${generatePrompt} Consider these weather conditions: ${data.weather.current.temperature_2m}°C, ${data.weather.current.relative_humidity_2m}% humidity, wind speed ${data.weather.current.wind_speed_10m}m/s in ${locationString}.`;
      setGeneratePrompt(weatherPrompt);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-4">
      <LocationSearch onLocationSelect={handleLocationSelect} />
      
      {weatherData && (
        <div className="text-sm text-primary">
          Weather conditions for {weatherData.location}:
          <ul className="list-disc list-inside mt-1">
            <li>Temperature: {weatherData.temperature}°C</li>
            <li>Humidity: {weatherData.humidity}%</li>
            <li>Wind Speed: {weatherData.windSpeed} m/s</li>
          </ul>
        </div>
      )}

      <Input
        placeholder="e.g., 'Focus on Olympic lifts this cycle, with emphasis on technique and progressive loading'"
        value={generatePrompt}
        onChange={(e) => setGeneratePrompt(e.target.value)}
        className="flex-1 border-2 border-primary bg-white text-black placeholder:text-gray-500"
      />
      
      <div className="flex gap-2 sm:gap-4">
        <Button 
          onClick={handleGenerateWorkout} 
          disabled={isGenerating}
          className="flex-1 sm:flex-none border-2 border-primary bg-card text-primary font-bold uppercase tracking-tight transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50 whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
        <Button 
          onClick={() => setShowGenerateInput(false)}
          variant="destructive"
          className="border-2 border-destructive bg-destructive text-destructive-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}