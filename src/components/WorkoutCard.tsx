import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { WorkoutSection } from "./workout/WorkoutSection";
import { WorkoutHeader } from "./workout/WorkoutHeader";
import { useWorkoutState } from "@/hooks/useWorkoutState";
import { exportToCalendar } from "@/utils/calendar";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
  onUpdate?: (updates: { warmup: string; workout: string; notes?: string; strength: string; description?: string; }) => void;
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
      await exportToCalendar(title, warmup, workout, notes || '', toast);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Card className="relative w-full animate-fade-in border-[4px] border-primary bg-muted shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[20px]">
        <WorkoutHeader
          title={title}
          isExporting={isExporting}
          onExport={handleExportCalendar}
          warmup={warmup}
          workout={workout}
          notes={notes}
          strength={strength}
          allWorkouts={allWorkouts}
          onUpdate={(updates) => {
            setState({
              ...updates,
              strength: strength
            });
            
            if (updates.description) {
              setCurrentDescription(updates.description);
            }
            
            if (onUpdate) {
              onUpdate({
                ...updates,
                strength: strength,
                description: updates.description
              });
            }
          }}
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