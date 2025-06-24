
import React from 'react';
import { motion } from 'framer-motion';
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
}

export const ModernInputContainer: React.FC<ModernInputContainerProps> = ({
  numberOfDays,
  setNumberOfDays,
  numberOfCycles,
  setNumberOfCycles
}) => {
  const { config, updateConfig, expandedCards, setExpandedCards } = useWorkoutConfig();

  // Get legacy hooks for compatibility during transition
  const {
    weatherData, weatherPrompt,
    handleWeatherUpdate,
  } = useInputContainerState();

  // Exercise selection handlers
  const { handleExerciseSelection } = useExerciseSelection({
    selectedExercises: config.selectedExercises,
    setSelectedExercises: (exercises: Exercise[]) => updateConfig({ selectedExercises: exercises }),
  });

  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // Update config when numberOfDays or numberOfCycles change
  React.useEffect(() => {
    updateConfig({ numberOfDays, numberOfCycles });
  }, [numberOfDays, numberOfCycles, updateConfig]);

  return (
    <motion.div 
      className="space-y-4 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ConfigProgressBar />

      {/* Training Schedule - First and auto-expanded */}
      <ModernTrainingScheduleCard
        numberOfDays={numberOfDays}
        numberOfCycles={numberOfCycles}
        onNumberOfDaysChange={setNumberOfDays}
        onNumberOfCyclesChange={setNumberOfCycles}
        isExpanded={expandedCards.schedule}
        onToggle={() => toggleCard('schedule')}
      />

      <ModernFitnessLevelCard
        fitnessLevel={config.fitnessLevel}
        onFitnessLevelChange={(value) => updateConfig({ fitnessLevel: value })}
        isExpanded={expandedCards.fitness}
        onToggle={() => toggleCard('fitness')}
      />

      <ModernGoalsCard
        prescribedExercises={config.prescribedExercises}
        onPrescribedExercisesChange={(value) => updateConfig({ prescribedExercises: value })}
        isExpanded={expandedCards.goals}
        onToggle={() => toggleCard('goals')}
      />

      <ModernInjuriesCard
        injuries={config.injuries}
        onInjuriesChange={(value) => updateConfig({ injuries: value })}
        isExpanded={expandedCards.injuries}
        onToggle={() => toggleCard('injuries')}
      />

      <ModernEquipmentCard
        selectedExercises={config.selectedExercises}
        onExerciseSelect={handleExerciseSelection}
        isExpanded={expandedCards.equipment}
        onToggle={() => toggleCard('equipment')}
      />

      <ModernWeatherCard
        weatherData={weatherData || config.weatherData}
        onWeatherUpdate={(data, prompt) => {
          handleWeatherUpdate(data, prompt);
          updateConfig({ weatherData: data, weatherPrompt: prompt });
        }}
        numberOfDays={numberOfDays}
        isExpanded={expandedCards.weather}
        onToggle={() => toggleCard('weather')}
      />

      {/* Configuration Summary */}
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
    </motion.div>
  );
};
