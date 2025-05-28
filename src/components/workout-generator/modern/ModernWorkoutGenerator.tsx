
import React from 'react';
import { WorkoutConfigProvider } from '@/contexts/WorkoutConfigContext';
import { ModernWorkoutForm } from './ModernWorkoutForm';
import { WorkoutChatContainer } from '../chat/WorkoutChatContainer';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useNavigate } from 'react-router-dom';
import { triggerConfetti } from '@/utils/confetti';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const ModernWorkoutGeneratorContent: React.FC = () => {
  const { config } = useWorkoutConfig();
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleGenerate = async () => {
    try {
      const data = await generateWorkout({
        prompt: '',
        weatherPrompt: config.weatherPrompt || '',
        selectedExercises: config.selectedExercises,
        fitnessLevel: config.fitnessLevel,
        prescribedExercises: config.prescribedExercises,
        numberOfDays: config.numberOfDays,
        numberOfCycles: config.numberOfCycles,
        injuries: config.injuries || undefined,
      });

      if (data) {
        triggerConfetti();
        
        const storageKey = session?.user?.id 
          ? `strength_design_current_workout_${session.user.id}` 
          : 'strength_design_current_workout';
          
        localStorage.setItem(storageKey, JSON.stringify(data));
        navigate("/workout-results", { state: { workouts: data } });
      }
    } catch (error) {
      console.error("Error generating workout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Workout Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized workout programs through an intelligent conversation. 
            Fill out your preferences and chat with our AI to refine your perfect workout.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="sticky top-8">
              <h2 className="text-2xl font-semibold mb-6">Workout Preferences</h2>
              <ModernWorkoutForm />
            </div>
          </motion.div>

          {/* Right Column - Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:h-[calc(100vh-8rem)]"
          >
            <div className="sticky top-8 h-full">
              <WorkoutChatContainer 
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const ModernWorkoutGenerator: React.FC = () => {
  return (
    <WorkoutConfigProvider>
      <ModernWorkoutGeneratorContent />
    </WorkoutConfigProvider>
  );
};
