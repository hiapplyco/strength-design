
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";
import { format } from "date-fns";

interface WorkoutReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newWorkout: WeeklyWorkouts;
  existingWorkoutCount: number;
  onConfirmReplace: () => void;
  onCancel: () => void;
}

export const WorkoutReplacementDialog = ({ 
  open, 
  onOpenChange, 
  newWorkout, 
  existingWorkoutCount,
  onConfirmReplace,
  onCancel
}: WorkoutReplacementDialogProps) => {
  const newWorkoutTitle = newWorkout._meta?.title || 'New Workout Plan';
  const newWorkoutDays = Object.keys(newWorkout).filter(key => key !== '_meta').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Replace Existing Workouts?
          </DialogTitle>
          <DialogDescription>
            You have {existingWorkoutCount} existing workout sessions in your fitness journal. 
            Do you want to replace them with your new workout plan?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              New Workout Plan
            </h4>
            <p className="text-sm text-muted-foreground mb-1">{newWorkoutTitle}</p>
            <p className="text-xs text-muted-foreground">{newWorkoutDays} workout days</p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Remove all existing scheduled workout sessions</li>
              <li>Replace them with your new workout plan</li>
              <li>Preserve completed workouts and journal entries</li>
              <li>Start the new plan from today</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Keep Both
          </Button>
          <Button onClick={onConfirmReplace} className="bg-orange-500 hover:bg-orange-600">
            <Calendar className="mr-2 h-4 w-4" />
            Replace Workouts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
