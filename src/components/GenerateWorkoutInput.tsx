import { useState } from "react";
import type { Exercise } from "./exercise-search/types";
import type { WeatherData } from "@/types/weather";
import { WeatherSection } from "./workout-generator/WeatherSection";
import { ExerciseSection } from "./workout-generator/ExerciseSection";
import { FitnessSection } from "./workout-generator/FitnessSection";
import { GenerateSection } from "./workout-generator/GenerateSection";
import { DaysSelection } from "./workout-generator/DaysSelection";
import { TooltipWrapper } from "./workout-generator/TooltipWrapper";
import { FileUploadSection } from "./workout-generator/FileUploadSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Dumbbell } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays
}: GenerateWorkoutInputProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");
  const [injuries, setInjuries] = useState<string>("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);
  const { toast } = useToast();

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(e => e.name === exercise.name)) {
        return prev.filter(e => e.name !== exercise.name);
      }
      return [...prev, exercise];
    });
  };

  const handlePrescribedFileSelect = async (file: File) => {
    try {
      setIsAnalyzingPrescribed(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await supabase.functions.invoke('process-file', {
        body: formData,
      });

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw response.error;
      }

      const { text } = response.data;
      setPrescribedExercises(text);
      
      toast({
        title: "Success",
        description: "Exercise program processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingPrescribed(false);
    }
  };

  const handleInjuriesFileSelect = async (file: File) => {
    try {
      setIsAnalyzingInjuries(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await supabase.functions.invoke('process-file', {
        body: formData,
      });

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw response.error;
      }

      const { text } = response.data;
      setInjuries(text);
      
      toast({
        title: "Success",
        description: "Medical document processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingInjuries(false);
    }
  };

  const isValid = fitnessLevel !== "" && numberOfDays > 0;

  const handleGenerateWithWeather = async () => {
    if (!isValid) return;

    if (typeof window !== 'undefined' && window.gtagSendEvent) {
      window.gtagSendEvent();
    }

    const prompts = {
      exercises: selectedExercises.length > 0 
        ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
        : "",
      fitness: fitnessLevel ? ` Consider this fitness profile: ${fitnessLevel}.` : "",
      prescribed: prescribedExercises ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.` : "",
      injuries: injuries ? ` Please consider these health conditions/injuries: ${injuries}.` : ""
    };
    
    const fullPrompt = `${weatherPrompt}${prompts.exercises}${prompts.fitness}${prompts.prescribed}${prompts.injuries}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          prompt: fullPrompt,
          weatherPrompt,
          selectedExercises,
          fitnessLevel,
          prescribedExercises,
          injuries,
          numberOfDays
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        toast({
          title: "Error",
          description: "Failed to generate workout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await handleGenerateWorkout({
        prompt: fullPrompt,
        weatherPrompt,
        selectedExercises,
        fitnessLevel,
        prescribedExercises
      });
      
      handleClear();
    } catch (error) {
      console.error("Error generating workout:", error);
      toast({
        title: "Error",
        description: "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setGeneratePrompt("");
    setWeatherData(null);
    setWeatherPrompt("");
    setSelectedExercises([]);
    setFitnessLevel("");
    setPrescribedExercises("");
    setInjuries("");
  };

  const startGenerating = () => {
    setIsGenerating(true);
    requestAnimationFrame(() => {
      handleGenerateWithWeather();
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className={`relative bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 p-8 space-y-8 ${isGenerating ? 'before:absolute before:inset-0 before:rounded-lg before:border-4 before:border-primary before:animate-[gradient_3s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent' : ''}`}>
        {/* Weather Section */}
        <WeatherSection 
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          renderTooltip={() => (
            <TooltipWrapper content="Weather conditions affect your workout performance. Adding your location helps create a program that's suitable for your environment." />
          )}
        />
        
        {/* Exercise Search Section */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Search Exercises & Equipment</h3>
            <TooltipWrapper content="Add specific equipment or exercises you have access to. This helps create workouts that match your available resources." />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ExerciseSection
              selectedExercises={selectedExercises}
              onExerciseSelect={handleExerciseSelect}
              renderTooltip={() => (
                <TooltipWrapper content="Add specific equipment or exercises you have access to." />
              )}
            />
          </div>
        </div>

        {/* Fitness Level Section */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Fitness Level</h3>
            <TooltipWrapper content="Select your fitness level to receive appropriately challenging workouts." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["beginner", "intermediate", "advanced", "elite"].map((level) => (
              <Button
                key={level}
                onClick={() => setFitnessLevel(level)}
                variant={fitnessLevel === level ? "default" : "outline"}
                className={`flex items-center gap-2 h-auto py-4 ${
                  fitnessLevel === level ? "bg-primary text-white" : "hover:bg-primary/10"
                }`}
              >
                <span className="capitalize">{level}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Prescribed Exercises Row */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Prescribed Exercises</h3>
            <TooltipWrapper content="Add any specific exercises you need to include in your workout program." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Textarea
              placeholder="List any specific exercises you need to include"
              value={prescribedExercises}
              onChange={(e) => setPrescribedExercises(e.target.value)}
              className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
            />
            <FileUploadSection
              title="Upload Exercise Program"
              isAnalyzing={isAnalyzingPrescribed}
              content={prescribedExercises}
              onFileSelect={handlePrescribedFileSelect}
              analysisSteps={["Processing file", "Extracting exercises", "Analyzing content"]}
            />
          </div>
        </div>

        {/* Injuries Row */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-oswald text-lg">Injuries & Health Considerations</h3>
            <TooltipWrapper content="Share any injuries or health conditions that may affect your workout." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Textarea
              placeholder="List any injuries, medical conditions, or movement limitations"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
            />
            <FileUploadSection
              title="Upload Medical Information"
              isAnalyzing={isAnalyzingInjuries}
              content={injuries}
              onFileSelect={handleInjuriesFileSelect}
              analysisSteps={["Processing file", "Extracting conditions", "Analyzing restrictions"]}
            />
          </div>
        </div>

        {/* Days Selection */}
        <DaysSelection
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          renderTooltip={() => (
            <TooltipWrapper content="Select the number of days for your workout program." />
          )}
        />

        {/* Generate Section */}
        <GenerateSection
          onGenerate={startGenerating}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={isValid}
          renderTooltip={() => (
            <TooltipWrapper content="Review your selections and generate a custom workout program tailored to your needs." />
          )}
        />
      </div>
    </div>
  );
}