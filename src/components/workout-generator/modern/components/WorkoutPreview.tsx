
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Dumbbell, ArrowLeft, FileText, Activity } from 'lucide-react';
import { WorkoutDayCard } from './WorkoutDayCard';
import { WorkoutCycleCard } from './WorkoutCycleCard';
import { WorkoutIntegrationDialog } from '@/components/nutrition-diary/WorkoutIntegrationDialog';
import { useWorkoutDocumentPublisher } from '../hooks/useWorkoutDocumentPublisher';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import type { WeeklyWorkouts } from '@/types/fitness';
import { isWorkoutCycle, isWorkoutDay } from '@/types/fitness';

interface WorkoutPreviewProps {
  generatedWorkout: WeeklyWorkouts | null;
  onReplaceWorkouts: () => void;
  isReplacing: boolean;
  existingWorkoutCount: number;
  onGoToGenerator: () => void;
}

export const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  generatedWorkout,
  onReplaceWorkouts,
  isReplacing,
  existingWorkoutCount,
  onGoToGenerator,
}) => {
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const { publishToDocument, isPublishing } = useWorkoutDocumentPublisher();
  const { saveWorkoutTemplate, isSaving } = useWorkoutTemplates();

  if (!generatedWorkout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Workout Generated Yet</h3>
        <p className="text-muted-foreground mb-6">
          Generate a workout first to see your personalized plan here.
        </p>
        <Button onClick={onGoToGenerator} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Generator
        </Button>
      </motion.div>
    );
  }

  // Count total workout days
  const totalWorkouts = Object.entries(generatedWorkout)
    .filter(([key]) => key !== '_meta')
    .reduce((count, [key, value]) => {
      if (isWorkoutCycle(value)) {
        return count + Object.keys(value).length;
      }
      return count + 1;
    }, 0);

  // Get workout title from meta or generate one
  const workoutTitle = generatedWorkout._meta?.title || 'Your Custom Workout Plan';

  const handlePublishToDocument = () => {
    publishToDocument(generatedWorkout);
  };

  const handleSaveTemplate = async () => {
    try {
      await saveWorkoutTemplate(generatedWorkout);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <CardTitle className="text-xl">{workoutTitle}</CardTitle>
          </div>
          <CardDescription>
            {totalWorkouts} workout sessions ready to schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={onReplaceWorkouts}
              disabled={isReplacing}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {existingWorkoutCount > 0 ? 'Replace & Schedule' : 'Schedule Workouts'}
            </Button>
            
            <Button 
              onClick={() => setShowNutritionDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Add to Nutrition Diary
            </Button>
            
            <Button 
              onClick={handlePublishToDocument}
              disabled={isPublishing}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {isPublishing ? 'Publishing...' : 'Publish to Document'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onGoToGenerator}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Generate New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workout Preview */}
      <div className="grid gap-4">
        {Object.entries(generatedWorkout)
          .filter(([key]) => key !== '_meta')
          .map(([key, value], index) => {
            if (isWorkoutCycle(value)) {
              return (
                <WorkoutCycleCard
                  key={key}
                  cycleKey={key}
                  cycle={value}
                  index={index}
                />
              );
            } else if (isWorkoutDay(value)) {
              return (
                <WorkoutDayCard
                  key={key}
                  dayKey={key}
                  workout={value}
                  index={index}
                />
              );
            }
            return null;
          })}
      </div>

      {/* Nutrition Integration Dialog */}
      <WorkoutIntegrationDialog
        isOpen={showNutritionDialog}
        onOpenChange={setShowNutritionDialog}
        workout={generatedWorkout}
      />
    </motion.div>
  );
};
