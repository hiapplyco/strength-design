
import { useState, useCallback } from "react";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { WeatherSection } from "./WeatherSection";
import { InjuriesSection } from "./InjuriesSection";
import { DaysSelectionCard } from "./DaysSelectionCard";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { GenerateSection } from "./GenerateSection";
import { PrescribedExercisesSection } from "./PrescribedExercisesSection";
import { WorkoutPresets } from "./WorkoutPresets";
import type { Exercise } from "../exercise-search/types";

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
  const [weatherData, setWeatherData] = useState("");
  const [weatherPrompt, setWeatherPrompt] = useState("");

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <WorkoutPresets 
          onSelectPreset={handleSelectPreset}
          onExercisesExtracted={(exercises) => setSelectedExercises(exercises)}
        />
        
        <PrescribedExercisesSection
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
        />
        
        <DaysSelectionCard 
          numberOfDays={numberOfDays} 
          setNumberOfDays={setNumberOfDays} 
        />
        
        <FitnessLevelSection
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
        />
        
        <InjuriesSection
          injuries={injuries}
          setInjuries={setInjuries}
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
        />
        
        <WeatherSection
          weatherData={weatherData}
          setWeatherData={setWeatherData}
          setWeatherPrompt={setWeatherPrompt}
        />
      </div>
      
      <div className="space-y-6">
        <ConfigurationSummary
          numberOfDays={numberOfDays}
          fitnessLevel={fitnessLevel}
          selectedExercises={selectedExercises}
          prescribedExercises={prescribedExercises}
          injuries={injuries}
          weatherData={weatherData}
        />
        
        <GenerateSection
          isGenerating={isGenerating}
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
