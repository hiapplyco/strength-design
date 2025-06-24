
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Dumbbell, ArrowLeft } from 'lucide-react';
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
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {Object.entries(value)
                          .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
                          .map(([dayKey, dayValue]) => (
                            <div key={dayKey} className="p-3 bg-muted/50 rounded-lg">
                              <h4 className="font-medium mb-2 capitalize">
                                {dayKey.replace(/day(\d+)/, 'Day $1')}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {(dayValue as any).description || (dayValue as any).workout?.substring(0, 100) + '...'}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            } else if (isWorkoutDay(value)) {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {key.replace(/day(\d+)/, 'Day $1')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {(value as any).description || (value as any).workout?.substring(0, 150) + '...'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }
            return null;
          })}
      </div>
    </motion.div>
  );
};
