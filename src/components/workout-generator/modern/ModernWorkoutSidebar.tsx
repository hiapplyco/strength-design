
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { User, Target, Calendar, AlertTriangle, Dumbbell, CheckCircle, Settings, Sparkles } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { ExerciseSearch } from '@/components/ExerciseSearch';
import type { Exercise } from '@/components/exercise-search/types';
import { motion, AnimatePresence } from 'framer-motion';

export const ModernWorkoutSidebar: React.FC = () => {
  const { config, updateConfig } = useWorkoutConfig();
  const [recentlyUpdated, setRecentlyUpdated] = useState<string[]>([]);
  const [showSparkles, setShowSparkles] = useState<string[]>([]);

  // Listen for configuration updates from chat
  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      const { updatedFields } = event.detail;
      setRecentlyUpdated(updatedFields);
      setShowSparkles(updatedFields);
      
      // Clear animations after delay
      setTimeout(() => {
        setRecentlyUpdated([]);
        setShowSparkles([]);
      }, 3000);
    };

    window.addEventListener('configUpdated', handleConfigUpdate as EventListener);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate as EventListener);
  }, []);

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

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 4;
    
    if (config.fitnessLevel) completed++;
    if (config.prescribedExercises) completed++;
    if (config.selectedExercises.length > 0 || config.prescribedExercises) completed++;
    if (config.numberOfDays !== 7 || config.numberOfCycles !== 1) completed++;
    
    return (completed / total) * 100;
  };

  const ConfigCard: React.FC<{ 
    children: React.ReactNode; 
    fieldName: string;
    icon: React.ReactNode;
    title: string;
    isComplete: boolean;
  }> = ({ children, fieldName, icon, title, isComplete }) => {
    const isUpdated = recentlyUpdated.includes(fieldName);
    const hasSparkles = showSparkles.includes(fieldName);
    
    return (
      <motion.div
        animate={isUpdated ? { 
          scale: [1, 1.03, 1], 
          boxShadow: [
            '0 0 0 0 rgba(var(--primary), 0)', 
            '0 0 0 6px rgba(var(--primary), 0.3)', 
            '0 0 0 0 rgba(var(--primary), 0)'
          ]
        } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <Card className={`mb-4 transition-all duration-500 ${
          isComplete ? 'border-primary/40 bg-primary/10' : 'border-border'
        } ${isUpdated ? 'ring-2 ring-primary/60 shadow-lg' : ''}`}>
          <CardHeader className="pb-3 relative">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={isUpdated ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0] 
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {icon}
                </motion.div>
                {title}
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {hasSparkles && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardTitle>
            
            {/* Animated glow effect */}
            <AnimatePresence>
              {isUpdated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(var(--primary), 0.1) 0%, transparent 70%)'
                  }}
                />
              )}
            </AnimatePresence>
          </CardHeader>
          <CardContent className="pt-0">
            <motion.div
              animate={isUpdated ? { y: [0, -2, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with animated progress */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Configuration</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <motion.span 
              key={getCompletionPercentage()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-medium"
            >
              {Math.round(getCompletionPercentage())}%
            </motion.span>
          </div>
          <motion.div>
            <Progress 
              value={getCompletionPercentage()} 
              className="h-2 transition-all duration-500" 
            />
          </motion.div>
        </div>
      </div>

      {/* Configuration Forms */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Fitness Level */}
          <ConfigCard
            fieldName="fitnessLevel"
            icon={<User className="h-4 w-4 text-primary" />}
            title="Fitness Level"
            isComplete={!!config.fitnessLevel}
          >
            <Select
              value={config.fitnessLevel}
              onValueChange={(value) => updateConfig({ fitnessLevel: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                <SelectItem value="intermediate">Intermediate (6+ months)</SelectItem>
                <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
                <SelectItem value="expert">Expert (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </ConfigCard>

          {/* Goals */}
          <ConfigCard
            fieldName="prescribedExercises"
            icon={<Target className="h-4 w-4 text-primary" />}
            title="Goals & Focus"
            isComplete={!!config.prescribedExercises}
          >
            <Textarea
              placeholder="Describe your fitness goals..."
              value={config.prescribedExercises}
              onChange={(e) => updateConfig({ prescribedExercises: e.target.value })}
              className="min-h-[80px] resize-none"
            />
          </ConfigCard>

          {/* Schedule */}
          <ConfigCard
            fieldName="schedule"
            icon={<Calendar className="h-4 w-4 text-primary" />}
            title="Training Schedule"
            isComplete={config.numberOfDays !== 7 || config.numberOfCycles !== 1}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Days per cycle: {config.numberOfDays}
                </label>
                <Slider
                  value={[config.numberOfDays]}
                  onValueChange={([value]) => updateConfig({ numberOfDays: value })}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Number of cycles: {config.numberOfCycles}
                </label>
                <Slider
                  value={[config.numberOfCycles]}
                  onValueChange={([value]) => updateConfig({ numberOfCycles: value })}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </ConfigCard>

          {/* Equipment & Exercises */}
          <ConfigCard
            fieldName="selectedExercises"
            icon={<Dumbbell className="h-4 w-4 text-primary" />}
            title="Available Equipment"
            isComplete={config.selectedExercises.length > 0}
          >
            <div className="space-y-3">
              <ExerciseSearch 
                onExerciseSelect={handleExerciseSelect}
                selectedExercises={config.selectedExercises}
              />
              <AnimatePresence>
                {config.selectedExercises.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-sm font-medium mb-2 block">Selected:</label>
                    <div className="flex flex-wrap gap-1">
                      {config.selectedExercises.map((exercise, index) => (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Badge 
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-xs transition-colors"
                            onClick={() => handleExerciseSelect(exercise)}
                          >
                            {exercise.name} ×
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ConfigCard>

          {/* Injuries & Limitations */}
          <ConfigCard
            fieldName="injuries"
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
            title="Limitations"
            isComplete={!!config.injuries}
          >
            <Textarea
              placeholder="Any injuries or limitations..."
              value={config.injuries}
              onChange={(e) => updateConfig({ injuries: e.target.value })}
              className="min-h-[60px] resize-none"
            />
          </ConfigCard>
        </div>
      </ScrollArea>
    </div>
  );
};
