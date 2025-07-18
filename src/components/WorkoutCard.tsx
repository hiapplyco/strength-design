
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { WorkoutSection } from "./workout/WorkoutSection";
import { WorkoutHeader } from "./workout/WorkoutHeader";
import { useWorkoutState } from "@/hooks/useWorkoutState";
import { exportToCalendar } from "@/utils/calendar";
import type { WorkoutDay } from "@/types/fitness";
import { shadows } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  allWorkouts?: Record<string, WorkoutDay>;
  onUpdate?: (updates: WorkoutDay) => void;
}

export function WorkoutCard({ title, description, duration, allWorkouts, onUpdate }: WorkoutCardProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [currentDescription, setCurrentDescription] = useState(description);
  const { warmup, workout, notes, strength, setState } = useWorkoutState(title, allWorkouts);

  const formatWorkoutText = () => {
    const sections = [
      strength && `Strength:\n${strength}`,
      warmup && `Warmup:\n${warmup}`,
      workout && `Workout:\n${workout}`,
      notes && `Notes:\n${notes}`
    ].filter(Boolean);

    return sections.join('\n\n');
  };

  const handleExportCalendar = async () => {
    try {
      setIsExporting(true);
      await exportToCalendar([{
        title,
        warmup: warmup || '',
        workout: workout || '',
        notes: notes || '',
        dayOffset: 0
      }], toast);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdate = (updates: Partial<WorkoutDay>) => {
    // Ensure all required fields are present
    const fullUpdates: WorkoutDay = {
      description: updates.description || currentDescription,
      warmup: updates.warmup || warmup,
      workout: updates.workout || workout,
      strength: updates.strength || strength,
      notes: updates.notes,
      // Only include exercises and images if present in the updates
      ...(updates.exercises && { exercises: updates.exercises }),
      ...(updates.images && { images: updates.images })
    };

    // Convert WorkoutDay to WorkoutState for setState
    const stateUpdate = {
      warmup: fullUpdates.warmup || '',
      workout: fullUpdates.workout || '',
      notes: fullUpdates.notes,
      strength: fullUpdates.strength || ''
    };
    
    setState(stateUpdate);
    
    if (updates.description) {
      setCurrentDescription(updates.description);
    }
    
    if (onUpdate) {
      onUpdate(fullUpdates);
    }
  };

  return (
    <div className="space-y-2">
      <Card className={cn(
        "relative w-full animate-fade-in border-[4px] border-primary bg-muted rounded-[20px]",
        shadows.brutal.lg
      )}>
        <WorkoutHeader
          title={title}
          isExporting={isExporting}
          onExport={handleExportCalendar}
          warmup={warmup || ''}
          workout={workout || ''}
          notes={notes}
          strength={strength || ''}
          allWorkouts={allWorkouts || {}}
          onUpdate={handleUpdate}
        />
        
        <CardContent className="space-y-4 p-6">
          <WorkoutSection
            label="Description"
            value={currentDescription}
            onChange={() => {}}
            minHeight="60px"
            isDescription={true}
          />
          <WorkoutSection
            label="Workout"
            value={formatWorkoutText()}
            onChange={() => {}}
            minHeight="200px"
          />
        </CardContent>
      </Card>
    </div>
  );
}
