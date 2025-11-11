
import React, { useState } from 'react';
import { WorkoutChatContainer } from './WorkoutChatContainer';
import { ConfigurationSummary } from '../ConfigurationSummary';
import { WorkoutUsageDisplay } from '../WorkoutUsageDisplay';
import { PaywallDialog } from '../PaywallDialog';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkoutUsage } from '@/hooks/useWorkoutUsage';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

export const WorkoutChatLayout: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const { config } = useWorkoutConfig();
  const { session } = useAuth();
  const { workoutUsage } = useWorkoutUsage();
  const { isGenerating, generateWorkout, showPaywall, setShowPaywall } = useWorkoutGeneration();
  const navigate = useNavigate();

  const handleMessagesUpdate = (newMessages: any[]) => {
    setMessages(newMessages);
  };

  const handleGenerateWorkout = async () => {
    // Check if user can generate workout
    if (!workoutUsage?.can_generate_workout) {
      setShowPaywall(true);
      return;
    }

    const prompts = {
      exercises: config.selectedExercises.length > 0 
        ? ` Include these exercises in the program: ${config.selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${config.selectedExercises.map(e => e.instructions[0]).join(" ")}` 
        : "",
      fitness: config.fitnessLevel ? ` Consider this fitness profile: ${config.fitnessLevel}.` : "",
      prescribed: config.prescribedExercises ? ` Please incorporate these prescribed exercises/restrictions: ${config.prescribedExercises}.` : "",
      injuries: config.injuries ? ` Please consider these health conditions/injuries: ${config.injuries}.` : ""
    };
    
    const fullPrompt = `${config.weatherPrompt}${prompts.exercises}${prompts.fitness}${prompts.prescribed}${prompts.injuries}`;
    
    const result = await generateWorkout({
      prompt: fullPrompt,
      weatherPrompt: config.weatherPrompt,
      selectedExercises: config.selectedExercises,
      fitnessLevel: config.fitnessLevel,
      prescribedExercises: config.prescribedExercises,
      injuries: config.injuries,
      numberOfDays: config.numberOfDays,
      numberOfCycles: config.numberOfCycles
    });

    if (result) {
      // Store workout data for the results page
      const storageKey = session?.user?.id 
        ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
        : WORKOUT_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(result));
      
      // Navigate to results page
      navigate("/workout-results", { state: { workouts: result } });
    }
  };

  const isConfigured = Boolean(
    config.fitnessLevel && 
    (config.prescribedExercises || config.selectedExercises.length > 0)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
      {/* Chat Interface - Takes up 2/3 on large screens */}
      <div className="lg:col-span-2 h-full">
        <div className="bg-card border border-border/50 rounded-lg h-full overflow-hidden">
          <WorkoutChatContainer
            isGenerating={isGenerating}
            onMessagesUpdate={handleMessagesUpdate}
          />
        </div>
      </div>

      {/* Configuration Panel - Takes up 1/3 on large screens */}
      <div className="lg:col-span-1 space-y-4 h-full overflow-auto">
        {/* Usage Display */}
        <WorkoutUsageDisplay />

        {/* Configuration Summary */}
        <ConfigurationSummary
          numberOfDays={config.numberOfDays}
          numberOfCycles={config.numberOfCycles}
          fitnessLevel={config.fitnessLevel}
          selectedExercises={config.selectedExercises}
          prescribedExercises={config.prescribedExercises}
          injuries={config.injuries}
          weatherData={config.weatherData}
          maxHeight="400px"
        />

        {/* Generate Button */}
        {isConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleGenerateWorkout}
              disabled={isGenerating || !isConfigured}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                  Generating Your Workout...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Workout
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Instructions */}
        {!isConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4 bg-muted/50 rounded-lg"
          >
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Chat with the AI to configure your workout preferences. The configuration will update automatically as you chat!
            </p>
          </motion.div>
        )}

        {/* Paywall Dialog */}
        <PaywallDialog 
          open={showPaywall} 
          onOpenChange={setShowPaywall} 
        />
      </div>
    </div>
  );
};
