import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, CloudSun, Dumbbell, Send } from "lucide-react";
import { LocationSearch } from "./LocationSearch";
import { ExerciseSearch } from "./ExerciseSearch";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./exercise-search/types";

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
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

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

      setWeatherPrompt(`Consider these weather conditions: ${data.weather.current.temperature_2m}°C, ${data.weather.current.relative_humidity_2m}% humidity, wind speed ${data.weather.current.wind_speed_10m}m/s in ${locationString}.`);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => [...prev, exercise]);
  };

  const handleGenerateWithWeather = () => {
    const exercisesPrompt = selectedExercises.length > 0 
      ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}.`
      : "";
    
    const fullPrompt = `${generatePrompt}${weatherPrompt ? ` ${weatherPrompt}` : ""}${exercisesPrompt}`;
    setGeneratePrompt(fullPrompt);
    handleGenerateWorkout();
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-6 bg-muted p-6 rounded-xl shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <CloudSun className="h-5 w-5" />
          <h3 className="font-oswald text-lg uppercase">Weather Conditions</h3>
        </div>
        <LocationSearch onLocationSelect={handleLocationSelect} />
        
        {weatherData && (
          <div className="bg-primary/10 rounded-lg p-4 text-sm text-primary animate-fade-in">
            <p className="font-semibold mb-2">{weatherData.location}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="font-semibold">{weatherData.temperature}°C</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="font-semibold">{weatherData.humidity}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Wind Speed</p>
                <p className="font-semibold">{weatherData.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Dumbbell className="h-5 w-5" />
          <h3 className="font-oswald text-lg uppercase">Exercise Selection</h3>
        </div>
        <ExerciseSearch 
          onExerciseSelect={handleExerciseSelect} 
          embedded={true}
          className="mb-4"
        />

        {selectedExercises.length > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in">
            <p className="font-semibold text-primary mb-2">Selected Exercises:</p>
            <div className="flex flex-wrap gap-2">
              {selectedExercises.map((exercise, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                  {exercise.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Send className="h-5 w-5" />
          <h3 className="font-oswald text-lg uppercase">Generate Workout</h3>
        </div>
        <Input
          placeholder="e.g., 'Focus on Olympic lifts this cycle, with emphasis on technique and progressive loading'"
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          className="bg-black text-white placeholder:text-gray-500"
        />
        
        <div className="flex gap-2 sm:gap-4">
          <Button 
            onClick={handleGenerateWithWeather} 
            disabled={isGenerating}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 font-oswald uppercase tracking-wide transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Generate Workout
              </>
            )}
          </Button>
          <Button 
            onClick={() => setShowGenerateInput(false)}
            variant="destructive"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}