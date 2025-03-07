
import { useState, useCallback } from "react";
import type { Exercise } from "../../exercise-search/types";
import type { WeatherData } from "@/types/weather";

export function useWorkoutInputState() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [prescribedExercises, setPrescribedExercises] = useState("");
  const [injuries, setInjuries] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);

  const handleWeatherUpdate = (newWeatherData: WeatherData | null, newWeatherPrompt: string) => {
    console.log('Weather data updated:', newWeatherData);
    console.log('Weather prompt:', newWeatherPrompt);
    setWeatherData(newWeatherData);
    setWeatherPrompt(newWeatherPrompt);
  };

  const handleFileProcessing = async (file: File, contentType: 'prescribed' | 'injuries', parseDocument: Function) => {
    if (contentType === 'prescribed') {
      setIsAnalyzingPrescribed(true);
    } else {
      setIsAnalyzingInjuries(true);
    }
    
    try {
      console.log(`Processing ${contentType} file:`, file.name);
      const result = await parseDocument(file);
      if (result.success) {
        const parsedText = `${result.text}`;
        
        if (contentType === 'prescribed') {
          const updatedText = prescribedExercises 
            ? `${prescribedExercises}\n\n------ PARSED WORKOUT ------\n\n${parsedText}`
            : parsedText;
          setPrescribedExercises(updatedText);
        } else {
          const updatedText = injuries 
            ? `${injuries}\n\n------ PARSED INFORMATION ------\n\n${parsedText}`
            : parsedText;
          setInjuries(updatedText);
        }
      }
    } catch (error) {
      console.error(`Error processing ${contentType} file:`, error);
    } finally {
      if (contentType === 'prescribed') {
        setIsAnalyzingPrescribed(false);
      } else {
        setIsAnalyzingInjuries(false);
      }
    }
  };

  const clearInputs = () => {
    setSelectedExercises([]);
    setFitnessLevel("");
    setPrescribedExercises("");
    setInjuries("");
    setWeatherData(null);
    setWeatherPrompt("");
  };

  return {
    selectedExercises,
    setSelectedExercises,
    fitnessLevel,
    setFitnessLevel,
    prescribedExercises,
    setPrescribedExercises,
    injuries,
    setInjuries,
    weatherData,
    weatherPrompt,
    isAnalyzingPrescribed,
    setIsAnalyzingPrescribed,
    isAnalyzingInjuries,
    setIsAnalyzingInjuries,
    handleWeatherUpdate,
    handleFileProcessing,
    clearInputs
  };
}
