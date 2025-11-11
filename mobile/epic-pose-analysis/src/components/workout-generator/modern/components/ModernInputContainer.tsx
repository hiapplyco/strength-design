
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export const ModernInputContainer: React.FC<ModernInputContainerProps> = ({
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

  // Exercise selection handlers
  const { handleExerciseSelection } = useExerciseSelection({
    selectedExercises: config.selectedExercises,
    setSelectedExercises: (exercises: Exercise[]) => updateConfig({ selectedExercises: exercises }),
  });

  const toggleCard = (cardName: string) => {
    if (isGenerating) return; // Prevent interaction during generation
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

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

  const containerVariants = {
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    },
    hidden: {
      opacity: 0.3,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        duration: 0.2
      }
    }
  };

  const cardVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      height: "auto",
      transition: { duration: 0.3 }
    },
    hidden: {
      opacity: 0.5,
      scale: 0.98,
      height: "auto",
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="space-y-4 w-full"
      initial="visible"
      animate={isGenerating ? "hidden" : "visible"}
      variants={containerVariants}
    >
      <AnimatePresence>
        {!isGenerating && (
          <motion.div
            key="progress-bar"
            variants={cardVariants}
            exit={{ opacity: 0, height: 0 }}
          >
            <ConfigProgressBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training Schedule - First and auto-expanded */}
      <motion.div variants={cardVariants}>
        <ModernTrainingScheduleCard
          numberOfDays={numberOfDays}
          numberOfCycles={numberOfCycles}
          onNumberOfDaysChange={setNumberOfDays}
          onNumberOfCyclesChange={setNumberOfCycles}
          isExpanded={expandedCards.schedule && !isGenerating}
          onToggle={() => toggleCard('schedule')}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ModernFitnessLevelCard
          fitnessLevel={config.fitnessLevel}
          onFitnessLevelChange={(value) => updateConfig({ fitnessLevel: value })}
          isExpanded={expandedCards.fitness && !isGenerating}
          onToggle={() => toggleCard('fitness')}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ModernGoalsCard
          prescribedExercises={config.prescribedExercises}
          onPrescribedExercisesChange={(value) => updateConfig({ prescribedExercises: value })}
          isExpanded={expandedCards.goals && !isGenerating}
          onToggle={() => toggleCard('goals')}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ModernInjuriesCard
          injuries={config.injuries}
          onInjuriesChange={(value) => updateConfig({ injuries: value })}
          isExpanded={expandedCards.injuries && !isGenerating}
          onToggle={() => toggleCard('injuries')}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ModernEquipmentCard
          selectedExercises={config.selectedExercises}
          onExerciseSelect={handleExerciseSelection}
          isExpanded={expandedCards.equipment && !isGenerating}
          onToggle={() => toggleCard('equipment')}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ModernWeatherCard
          weatherData={weatherData || config.weatherData}
          onWeatherUpdate={(data, prompt) => {
            handleWeatherUpdate(data, prompt);
            updateConfig({ weatherData: data, weatherPrompt: prompt });
          }}
          numberOfDays={numberOfDays}
          isExpanded={expandedCards.weather && !isGenerating}
          onToggle={() => toggleCard('weather')}
        />
      </motion.div>

      {/* Configuration Summary */}
      <AnimatePresence>
        {!isGenerating && (
          <motion.div
            key="config-summary"
            variants={cardVariants}
            exit={{ opacity: 0, height: 0 }}
          >
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};
