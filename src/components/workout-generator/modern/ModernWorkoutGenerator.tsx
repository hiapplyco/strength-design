
import React, { useState } from 'react';
import { WorkoutConfigProvider } from '@/contexts/WorkoutConfigContext';
import { ModernWorkoutForm } from './ModernWorkoutForm';
import { WorkoutChatContainer } from '../chat/WorkoutChatContainer';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useNavigate } from 'react-router-dom';
import { triggerConfetti } from '@/utils/confetti';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Settings, Eye, EyeOff } from 'lucide-react';

const ModernWorkoutGeneratorContent: React.FC = () => {
  const { config } = useWorkoutConfig();
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showForm, setShowForm] = useState(true);

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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Create personalized workout programs through an intelligent conversation. 
            Tell our AI about your goals and let it guide you to the perfect workout.
          </p>
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={showForm ? "outline" : "ghost"}
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              {showForm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showForm ? 'Hide Form' : 'Show Form'}
            </Button>
            <div className="text-sm text-muted-foreground">
              Chat-driven experience • AI guides you through setup
            </div>
          </div>
        </motion.div>

        <div className={`grid gap-8 max-w-7xl mx-auto ${showForm ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Left Column - Form (conditional) */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Workout Preferences</h2>
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <ModernWorkoutForm />
              </div>
            </motion.div>
          )}

          {/* Right Column - Chat (or full width when form hidden) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:h-[calc(100vh-8rem)]"
          >
            <div className="sticky top-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">AI Coach</h2>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
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
