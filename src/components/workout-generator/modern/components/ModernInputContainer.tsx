
import React, { useCallback, useMemo, memo } from 'react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useInputContainerState } from '../../input-container/hooks/useInputContainerState';
import { useExerciseSelection } from '../../input-container/hooks/useExerciseSelection';
import { ModernFitnessLevelCard } from '../cards/ModernFitnessLevelCard';
import { ModernGoalsCard } from '../cards/ModernGoalsCard';
import { ModernInjuriesCard } from '../cards/ModernInjuriesCard';
import { ModernTrainingScheduleCard } from '../cards/ModernTrainingScheduleCard';
import { ModernEquipmentCard } from '../cards/ModernEquipmentCard';
import { ModernWeatherCard } from '../cards/ModernWeatherCard';
import { ConfigProgressBar } from './ConfigProgressBar';
import { ConfigurationSummary } from '../../ConfigurationSummary';
import type { Exercise } from '@/components/exercise-search/types';

interface ModernInputContainerProps {
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
  numberOfCycles: number;
  setNumberOfCycles: (value: number) => void;
  isGenerating?: boolean;
}

const ModernInputContainerComponent: React.FC<ModernInputContainerProps> = ({
  numberOfDays,
  setNumberOfDays,
  numberOfCycles,
  setNumberOfCycles,
  isGenerating = false
}) => {
  const { config, updateConfig, expandedCards, setExpandedCards } = useWorkoutConfig();

  // Get legacy hooks for compatibility during transition
  const {
    weatherData, weatherPrompt,
    handleWeatherUpdate,
  } = useInputContainerState();

  // Memoize selected exercises setter to prevent unnecessary re-renders
  const setSelectedExercises = useCallback((exercises: Exercise[]) => {
    updateConfig({ selectedExercises: exercises });
  }, [updateConfig]);

  // Exercise selection handlers
  const { handleExerciseSelection } = useExerciseSelection({
    selectedExercises: config.selectedExercises,
    setSelectedExercises,
  });

  // Memoize toggle handler
  const toggleCard = useCallback((cardName: string) => {
    if (isGenerating) return; // Prevent interaction during generation
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  }, [isGenerating, setExpandedCards]);

  // Memoize weather update handler
  const handleWeatherUpdateCallback = useCallback((data: any, prompt: string) => {
    handleWeatherUpdate(data, prompt);
    updateConfig({ weatherData: data, weatherPrompt: prompt });
  }, [handleWeatherUpdate, updateConfig]);

  // Collapse all cards when generating
  React.useEffect(() => {
    if (isGenerating) {
      setExpandedCards(prev => Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>));
    }
  }, [isGenerating, setExpandedCards]);

  // Update config when numberOfDays or numberOfCycles change
  React.useEffect(() => {
    updateConfig({ numberOfDays, numberOfCycles });
  }, [numberOfDays, numberOfCycles, updateConfig]);

  // Memoize handlers for each card
  const fitnessLevelChangeHandler = useCallback((value: string) => {
    updateConfig({ fitnessLevel: value });
  }, [updateConfig]);

  const prescribedExercisesChangeHandler = useCallback((value: string) => {
    updateConfig({ prescribedExercises: value });
  }, [updateConfig]);

  const injuriesChangeHandler = useCallback((value: string) => {
    updateConfig({ injuries: value });
  }, [updateConfig]);

  return (
    <div
      className="space-y-4 w-full transition-opacity duration-300"
      style={{ opacity: isGenerating ? 0.6 : 1 }}
    >
      {!isGenerating && (
        <div className="animate-in fade-in duration-200">
          <ConfigProgressBar />
        </div>
      )}

      {/* Training Schedule - First and auto-expanded */}
      <div className="transition-all duration-200">
        <ModernTrainingScheduleCard
          numberOfDays={numberOfDays}
          numberOfCycles={numberOfCycles}
          onNumberOfDaysChange={setNumberOfDays}
          onNumberOfCyclesChange={setNumberOfCycles}
          isExpanded={expandedCards.schedule && !isGenerating}
          onToggle={() => toggleCard('schedule')}
        />
      </div>

      <div className="transition-all duration-200">
        <ModernFitnessLevelCard
          fitnessLevel={config.fitnessLevel}
          onFitnessLevelChange={fitnessLevelChangeHandler}
          isExpanded={expandedCards.fitness && !isGenerating}
          onToggle={() => toggleCard('fitness')}
        />
      </div>

      <div className="transition-all duration-200">
        <ModernGoalsCard
          prescribedExercises={config.prescribedExercises}
          onPrescribedExercisesChange={prescribedExercisesChangeHandler}
          isExpanded={expandedCards.goals && !isGenerating}
          onToggle={() => toggleCard('goals')}
        />
      </div>

      <div className="transition-all duration-200">
        <ModernInjuriesCard
          injuries={config.injuries}
          onInjuriesChange={injuriesChangeHandler}
          isExpanded={expandedCards.injuries && !isGenerating}
          onToggle={() => toggleCard('injuries')}
        />
      </div>

      <div className="transition-all duration-200">
        <ModernEquipmentCard
          selectedExercises={config.selectedExercises}
          onExerciseSelect={handleExerciseSelection}
          isExpanded={expandedCards.equipment && !isGenerating}
          onToggle={() => toggleCard('equipment')}
        />
      </div>

      <div className="transition-all duration-200">
        <ModernWeatherCard
          weatherData={weatherData || config.weatherData}
          onWeatherUpdate={handleWeatherUpdateCallback}
          numberOfDays={numberOfDays}
          isExpanded={expandedCards.weather && !isGenerating}
          onToggle={() => toggleCard('weather')}
        />
      </div>

      {/* Configuration Summary */}
      {!isGenerating && (
        <div className="animate-in fade-in duration-200">
          <ConfigurationSummary
            numberOfDays={numberOfDays}
            numberOfCycles={numberOfCycles}
            fitnessLevel={config.fitnessLevel}
            selectedExercises={config.selectedExercises}
            prescribedExercises={config.prescribedExercises}
            injuries={config.injuries}
            weatherData={weatherData || config.weatherData}
            maxHeight="30vh"
          />
        </div>
      )}
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export const ModernInputContainer = memo(ModernInputContainerComponent);
