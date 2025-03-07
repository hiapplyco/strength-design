
import { useCallback } from "react";
import { PresetsSection } from "./input-sections/PresetsSection";
import { DaysSelectionCard } from "./DaysSelectionCard";
import { FitnessLevelSection } from "./FitnessLevelSection";
import { PrescribedExercisesSection } from "./PrescribedExercisesSection";
import { InjuriesSection } from "./InjuriesSection";
import { WeatherSection } from "./WeatherSection";
import { GenerateSection } from "./GenerateSection";
import { useGeminiExerciseExtraction } from "./hooks/useGeminiExerciseExtraction";
import { useWorkoutInputState } from "./hooks/useWorkoutInputState";

interface InputContainerProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: any) => Promise<void>;
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
  numberOfDays,
  setNumberOfDays,
}: InputContainerProps) {
  const {
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
    isAnalyzingInjuries,
    handleWeatherUpdate,
    handleFileProcessing,
    clearInputs
  } = useWorkoutInputState();

  const { parseDocument } = useGeminiExerciseExtraction();

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
    [setNumberOfDays, setGeneratePrompt, setPrescribedExercises, setFitnessLevel]
  );
  
  const handlePrescribedFileSelect = async (file: File) => {
    await handleFileProcessing(file, 'prescribed', parseDocument);
  };
  
  const handleInjuriesFileSelect = async (file: File) => {
    await handleFileProcessing(file, 'injuries', parseDocument);
  };

  const handleSubmit = useCallback(() => {
    setIsGenerating(true);
    
    console.log('Sending to workout generator:');
    console.log('- Weather prompt:', weatherPrompt);
    console.log('- Fitness level:', fitnessLevel);
    console.log('- Number of days:', numberOfDays);
    console.log('- Prescribed exercises:', prescribedExercises ? 'provided' : 'none');
    console.log('- Injuries:', injuries ? 'provided' : 'none');
    
    handleGenerateWorkout({
      prompt: generatePrompt,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries
    }).finally(() => {
      setIsGenerating(false);
    });
  }, [
    generatePrompt,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    handleGenerateWorkout,
    setIsGenerating,
    numberOfDays,
  ]);

  return (
    <div className="w-full mx-auto max-w-full px-0 sm:px-2">
      <div className="space-y-5 sm:space-y-6 pb-6 px-2">
        <PresetsSection 
          onSelectPreset={handleSelectPreset}
          onExercisesExtracted={(exercises) => setSelectedExercises(exercises)}
          currentPrescribedExercises={prescribedExercises}
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
          numberOfDays={numberOfDays}
        />
        
        <GenerateSection
          isGenerating={isGenerating}
          onGenerate={handleSubmit}
          onClear={clearInputs}
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
    </div>
  );
}
