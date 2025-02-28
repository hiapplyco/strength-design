
import { useState, useCallback } from "react";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { WeatherSection } from "./WeatherSection";
import { InjuriesSection } from "./InjuriesSection";
import { DaysSelectionCard } from "./DaysSelectionCard";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { GenerateSection } from "./GenerateSection";
import { PrescribedExercisesSection } from "./PrescribedExercisesSection";
import { WorkoutPresets } from "./WorkoutPresets";
import { ScrollArea } from "../ui/scroll-area";
import type { Exercise } from "../exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface InputContainerProps {
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
  showGenerateInput: boolean;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function InputContainer({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  showGenerateInput,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
}: InputContainerProps) {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [prescribedExercises, setPrescribedExercises] = useState("");
  const [injuries, setInjuries] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);

  const handleSelectPreset = useCallback(
    (preset: {
      title: string;
      prescribedExercises: string;
      fitnessLevel: string;
      numberOfDays: number;
    }) => {
      setPrescribedExercises(preset.prescribedExercises);
      setFitnessLevel(preset.fitnessLevel);
      setNumberOfDays(preset.numberOfDays);
      setGeneratePrompt(preset.title);
    },
    [setNumberOfDays, setGeneratePrompt]
  );
  
  const handlePrescribedFileSelect = async (file: File) => {
    setIsAnalyzingPrescribed(true);
    try {
      // Simulate file analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPrescribedExercises("File content would be analyzed and extracted here");
    } finally {
      setIsAnalyzingPrescribed(false);
    }
  };
  
  const handleInjuriesFileSelect = async (file: File) => {
    setIsAnalyzingInjuries(true);
    try {
      // Simulate file analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInjuries("Health considerations would be extracted from file here");
    } finally {
      setIsAnalyzingInjuries(false);
    }
  };

  const handleWeatherUpdate = (newWeatherData: WeatherData | null, newWeatherPrompt: string) => {
    setWeatherData(newWeatherData);
    setWeatherPrompt(newWeatherPrompt);
  };

  const handleSubmit = useCallback(() => {
    setIsGenerating(true);
    
    handleGenerateWorkout({
      prompt: generatePrompt,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
    }).finally(() => {
      setIsGenerating(false);
    });
  }, [
    generatePrompt,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    handleGenerateWorkout,
    setIsGenerating,
  ]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <div className="space-y-6 pb-6">
          <WorkoutPresets 
            onSelectPreset={handleSelectPreset}
            onExercisesExtracted={(exercises) => setSelectedExercises(exercises)}
          />
          
          <ConfigurationSummary
            numberOfDays={numberOfDays}
            fitnessLevel={fitnessLevel}
            selectedExercises={selectedExercises}
            prescribedExercises={prescribedExercises}
            injuries={injuries}
            weatherData={weatherData}
          />
          
          <DaysSelectionCard 
            numberOfDays={numberOfDays} 
            setNumberOfDays={setNumberOfDays} 
          />
          
          <FitnessLevelSection
            fitnessLevel={fitnessLevel}
            setFitnessLevel={setFitnessLevel}
          />
          
          <PrescribedExercisesSection
            prescribedExercises={prescribedExercises}
            setPrescribedExercises={setPrescribedExercises}
            isAnalyzingPrescribed={isAnalyzingPrescribed}
            handlePrescribedFileSelect={handlePrescribedFileSelect}
          />
          
          <InjuriesSection
            injuries={injuries}
            setInjuries={setInjuries}
            isAnalyzingInjuries={isAnalyzingInjuries}
            handleInjuriesFileSelect={handleInjuriesFileSelect}
          />
          
          <WeatherSection
            weatherData={weatherData}
            onWeatherUpdate={handleWeatherUpdate}
            renderTooltip={() => null}
          />
          
          <GenerateSection
            isGenerating={isGenerating}
            onGenerate={handleSubmit}
            onClear={() => {
              setSelectedExercises([]);
              setFitnessLevel("");
              setPrescribedExercises("");
              setInjuries("");
              setWeatherData(null);
              setWeatherPrompt("");
            }}
            isValid={true}
            numberOfDays={numberOfDays}
            setNumberOfDays={setNumberOfDays}
            selectedExercises={selectedExercises}
            fitnessLevel={fitnessLevel}
            prescribedExercises={prescribedExercises}
            injuries={injuries}
            weatherData={weatherData}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
