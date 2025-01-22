import { useState } from "react";
import type { Exercise } from "./exercise-search/types";
import type { WeatherData } from "@/types/weather";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessSection } from "./workout-generator/FitnessSection";
import { GenerateSection } from "./workout-generator/GenerateSection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: GenerateWorkoutInputProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!selectedExercises.some(e => e.name === exercise.name)) {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const isValid = fitnessLevel !== "" && numberOfDays > 0;

  const handleGenerateWithWeather = async () => {
    if (!isValid) return;

    const exercisesPrompt = selectedExercises.length > 0 
      ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
      : "";
    
    const fitnessPrompt = fitnessLevel 
      ? ` Consider this fitness profile: ${fitnessLevel}.`
      : "";

    const prescribedPrompt = prescribedExercises
      ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.`
      : "";
    
    const fullPrompt = `${weatherPrompt}${exercisesPrompt}${fitnessPrompt}${prescribedPrompt}`;
    setGeneratePrompt(fullPrompt);

    try {
      await handleGenerateWorkout();
      handleClear();
    } catch (error) {
      console.error("Error generating workout:", error);
    }
  };

  const handleClear = () => {
    setGeneratePrompt("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
    setFitnessLevel("");
    setPrescribedExercises("");
  };

  const renderTooltip = (content: string) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 hover:bg-primary/10 rounded-full transition-colors">
            <HelpCircle className="h-4 w-4 text-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="start" 
          className="max-w-xs bg-primary text-primary-foreground p-2 text-sm"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col w-full gap-6 bg-muted/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          renderTooltip={() => renderTooltip(
            "Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment."
          )}
        />
        
        <ExerciseSection
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          renderTooltip={() => renderTooltip(
            "Add specific equipment or exercises you have access to. This helps create workouts that match your available resources."
          )}
        />

        <FitnessSection
          fitnessLevel={fitnessLevel}
          onFitnessLevelChange={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          onPrescribedExercisesChange={setPrescribedExercises}
          renderTooltip={() => renderTooltip(
            "Share your fitness level and any prescribed exercises to receive personalized workouts that match your capabilities and requirements."
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">How many days would you like to train?</h3>
            {renderTooltip("Select how many days of workouts to generate (1-12 days)")}
          </div>
          <ToggleGroup 
            type="single" 
            value={numberOfDays.toString()}
            onValueChange={(value) => setNumberOfDays(parseInt(value || "7"))}
            className="flex flex-wrap gap-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => (
              <ToggleGroupItem 
                key={day} 
                value={day.toString()}
                className="px-3 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {day}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <GenerateSection
          onGenerate={handleGenerateWithWeather}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={isValid}
          renderTooltip={() => renderTooltip(
            "Review your selections and generate a custom workout program tailored to your needs."
          )}
        />
      </div>
    </div>
  );
}