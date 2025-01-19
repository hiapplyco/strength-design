import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, CloudSun, Dumbbell, Send, Activity } from "lucide-react";
import { LocationSearch } from "./LocationSearch";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./exercise-search/types";
import { ExerciseSearch } from "./ExerciseSearch";

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
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
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
  const [fitnessLevel, setFitnessLevel] = useState<string>("");

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
        location: locationString,
        apparentTemperature: data.weather.current.apparent_temperature,
        precipitation: data.weather.current.precipitation,
        weatherCode: data.weather.current.weather_code
      });

      setWeatherPrompt(`Consider these weather conditions: ${data.weather.current.temperature_2m}°C (${(data.weather.current.temperature_2m * 9/5 + 32).toFixed(1)}°F), ${data.weather.current.relative_humidity_2m}% humidity, wind speed ${data.weather.current.wind_speed_10m}m/s in ${locationString}.`);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const getWeatherDescription = (code: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };
    return weatherCodes[code] || "Unknown";
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!selectedExercises.some(e => e.name === exercise.name)) {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const handleGenerateWithWeather = () => {
    const exercisesPrompt = selectedExercises.length > 0 
      ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
      : "";
    
    const fitnessPrompt = fitnessLevel 
      ? ` Consider this fitness profile: ${fitnessLevel}.`
      : "";
    
    const fullPrompt = `${generatePrompt}${weatherPrompt ? ` ${weatherPrompt}` : ""}${exercisesPrompt}${fitnessPrompt}`;
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="font-semibold">
                  {weatherData.temperature}°C
                  <br />
                  {(weatherData.temperature * 9/5 + 32).toFixed(1)}°F
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Feels Like</p>
                <p className="font-semibold">
                  {weatherData.apparentTemperature}°C
                  <br />
                  {(weatherData.apparentTemperature * 9/5 + 32).toFixed(1)}°F
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="font-semibold">{weatherData.humidity}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Wind Speed</p>
                <p className="font-semibold">
                  {weatherData.windSpeed} m/s
                  <br />
                  {(weatherData.windSpeed * 2.237).toFixed(1)} mph
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precipitation</p>
                <p className="font-semibold">{weatherData.precipitation} mm</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conditions</p>
                <p className="font-semibold">{getWeatherDescription(weatherData.weatherCode)}</p>
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
        <ExerciseSearch onExerciseSelect={handleExerciseSelect} />

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
          <Activity className="h-5 w-5" />
          <h3 className="font-oswald text-lg uppercase">Fitness Level</h3>
        </div>
        <Input
          placeholder="e.g., 'Intermediate, RX weights, moderate fatigue from yesterday's session'"
          value={fitnessLevel}
          onChange={(e) => setFitnessLevel(e.target.value)}
          className="bg-white text-black placeholder:text-gray-500"
        />
        {fitnessLevel && (
          <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in">
            <p className="font-semibold text-primary">Fitness Profile:</p>
            <p>{fitnessLevel}</p>
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
          className="bg-white text-black placeholder:text-gray-500"
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
