
import React, { useState } from 'react';
import { WorkoutConfigProvider } from '@/contexts/WorkoutConfigContext';
import { ModernWorkoutSidebar } from './ModernWorkoutSidebar';
import { WorkoutChatContainer } from '../chat/WorkoutChatContainer';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useNavigate } from 'react-router-dom';
import { triggerConfetti } from '@/utils/confetti';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PanelRight, MessageSquare, Sparkles, Zap } from 'lucide-react';

const ModernWorkoutGeneratorContent: React.FC = () => {
  const { config } = useWorkoutConfig();
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showSidebar, setShowSidebar] = useState(true);

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

  const isFormComplete = () => {
    return config.fitnessLevel && (
      config.prescribedExercises || 
      config.selectedExercises.length > 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="flex h-screen">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'mr-96' : 'mr-0'}`}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-border/50 bg-background/95 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  AI Workout Generator
                </h1>
                <p className="text-muted-foreground mt-1">
                  Chat with our AI to create your perfect workout plan
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center gap-2"
              >
                <PanelRight className={`h-4 w-4 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
                {showSidebar ? 'Hide Config' : 'Show Config'}
              </Button>
            </div>
          </motion.div>

          {/* Chat Container */}
          <div className="flex-1 p-6 pb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full max-w-4xl mx-auto"
            >
              <WorkoutChatContainer 
                isGenerating={isGenerating}
              />
            </motion.div>
          </div>

          {/* Generate Button Section */}
          <div className="p-6 pt-4 border-t border-border/50 bg-background/95 backdrop-blur">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !isFormComplete()}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12"
              >
                <Zap className="h-5 w-5 mr-2" />
                {isGenerating ? 'Generating Your Workout...' : 'Generate My Workout'}
              </Button>
              
              {!isFormComplete() && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Chat with the AI to set up your fitness level and goals first
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ 
            x: showSidebar ? 0 : 400, 
            opacity: showSidebar ? 1 : 0 
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border/50 shadow-xl z-10"
        >
          <ModernWorkoutSidebar />
        </motion.div>
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
