
import React, { useState, useEffect } from 'react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { FitnessLevelCard } from './cards/FitnessLevelCard';
import { GoalsCard } from './cards/GoalsCard';
import { TrainingScheduleCard } from './cards/TrainingScheduleCard';
import { EquipmentCard } from './cards/EquipmentCard';
import { InjuriesCard } from './cards/InjuriesCard';
import type { Exercise } from '@/components/exercise-search/types';

export const ModernWorkoutForm: React.FC = () => {
  const { config, updateConfig } = useWorkoutConfig();
  const [recentlyUpdated, setRecentlyUpdated] = useState<string[]>([]);

  // Track when fields are updated to show visual feedback
  useEffect(() => {
    const timer = setTimeout(() => setRecentlyUpdated([]), 3000);
    return () => clearTimeout(timer);
  }, [recentlyUpdated]);

  const handleExerciseSelect = (exercise: Exercise) => {
    const isSelected = config.selectedExercises.some(e => e.id === exercise.id);
    if (isSelected) {
      updateConfig({
        selectedExercises: config.selectedExercises.filter(e => e.id !== exercise.id)
      });
    } else {
      updateConfig({
        selectedExercises: [...config.selectedExercises, exercise]
      });
    }
  };

  const markFieldUpdated = (fieldName: string) => {
    setRecentlyUpdated(prev => [...prev, fieldName]);
  };

  const handleFitnessLevelChange = (value: string) => {
    updateConfig({ fitnessLevel: value });
    markFieldUpdated('fitnessLevel');
  };

  const handlePrescribedExercisesChange = (value: string) => {
    updateConfig({ prescribedExercises: value });
    markFieldUpdated('prescribedExercises');
  };

  const handleNumberOfDaysChange = (value: number) => {
    updateConfig({ numberOfDays: value });
    markFieldUpdated('schedule');
  };

  const handleNumberOfCyclesChange = (value: number) => {
    updateConfig({ numberOfCycles: value });
    markFieldUpdated('schedule');
  };

  const handleInjuriesChange = (value: string) => {
    updateConfig({ injuries: value });
    markFieldUpdated('injuries');
  };

  return (
    <div className="space-y-6">
      <FitnessLevelCard
        fitnessLevel={config.fitnessLevel}
        onFitnessLevelChange={handleFitnessLevelChange}
      />

      <GoalsCard
        prescribedExercises={config.prescribedExercises}
        onPrescribedExercisesChange={handlePrescribedExercisesChange}
      />

      <TrainingScheduleCard
        numberOfDays={config.numberOfDays}
        numberOfCycles={config.numberOfCycles}
        onNumberOfDaysChange={handleNumberOfDaysChange}
        onNumberOfCyclesChange={handleNumberOfCyclesChange}
      />

      <EquipmentCard
        selectedExercises={config.selectedExercises}
        onExerciseSelect={handleExerciseSelect}
      />

      <InjuriesCard
        injuries={config.injuries}
        onInjuriesChange={handleInjuriesChange}
      />
    </div>
  );
};
