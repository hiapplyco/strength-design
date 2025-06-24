
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInputContainerState } from '../../input-container/hooks/useInputContainerState';
import { useExerciseSelection } from '../../input-container/hooks/useExerciseSelection';
import { ModernFitnessLevelCard } from '../cards/ModernFitnessLevelCard';
import { ModernGoalsCard } from '../cards/ModernGoalsCard';
import { ModernInjuriesCard } from '../cards/ModernInjuriesCard';
import { ModernTrainingScheduleCard } from '../cards/ModernTrainingScheduleCard';
import { ModernEquipmentCard } from '../cards/ModernEquipmentCard';
import { ModernWeatherCard } from '../cards/ModernWeatherCard';
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
  // Expanded state for each card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    fitness: false,
    goals: false,
    injuries: false,
    schedule: false,
    equipment: false,
    weather: false,
  });

  // All state management
  const {
    fitnessLevel, setFitnessLevel,
    injuries, setInjuries,
    selectedExercises, setSelectedExercises,
    prescribedExercises, setPrescribedExercises,
    weatherData, weatherPrompt,
    handleWeatherUpdate,
  } = useInputContainerState();

  // Exercise selection handlers
  const { handleExerciseSelection } = useExerciseSelection({
    selectedExercises,
    setSelectedExercises,
  });

  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  return (
    <motion.div 
      className="space-y-4 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ModernFitnessLevelCard
        fitnessLevel={fitnessLevel}
        onFitnessLevelChange={setFitnessLevel}
        isExpanded={expandedCards.fitness}
        onToggle={() => toggleCard('fitness')}
      />

      <ModernGoalsCard
        prescribedExercises={prescribedExercises}
        onPrescribedExercisesChange={setPrescribedExercises}
        isExpanded={expandedCards.goals}
        onToggle={() => toggleCard('goals')}
      />

      <ModernInjuriesCard
        injuries={injuries}
        onInjuriesChange={setInjuries}
        isExpanded={expandedCards.injuries}
        onToggle={() => toggleCard('injuries')}
      />

      <ModernTrainingScheduleCard
        numberOfDays={numberOfDays}
        numberOfCycles={numberOfCycles}
        onNumberOfDaysChange={setNumberOfDays}
        onNumberOfCyclesChange={setNumberOfCycles}
        isExpanded={expandedCards.schedule}
        onToggle={() => toggleCard('schedule')}
      />

      <ModernEquipmentCard
        selectedExercises={selectedExercises}
        onExerciseSelect={handleExerciseSelection}
        isExpanded={expandedCards.equipment}
        onToggle={() => toggleCard('equipment')}
      />

      <ModernWeatherCard
        weatherData={weatherData}
        onWeatherUpdate={handleWeatherUpdate}
        numberOfDays={numberOfDays}
        isExpanded={expandedCards.weather}
        onToggle={() => toggleCard('weather')}
      />
    </motion.div>
  );
};
