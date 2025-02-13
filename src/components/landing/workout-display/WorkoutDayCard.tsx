
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";

interface WorkoutDayCardProps {
  day: string;
  index: number;
  workout: {
    description: string;
    warmup: string;
    workout: string;
    strength: string;
    notes?: string;
  };
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  allWorkouts: Record<string, any>;
  onUpdate: (day: string, updates: any) => void;
}

export const WorkoutDayCard = ({
  day,
  index,
  workout,
  isExporting,
  setIsExporting,
  allWorkouts,
  onUpdate
}: WorkoutDayCardProps) => {
  const { toast } = useToast();

  return (
    <div className="w-full bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 mx-auto max-w-[95%] sm:max-w-full">
      <WorkoutHeader
        title={`Day${index + 1}`}
        isExporting={isExporting}
        onExport={async () => {
          try {
            setIsExporting(true);
            await exportToCalendar([{
              title: `Day ${index + 1}`,
              warmup: workout.warmup,
              workout: workout.workout,
              notes: workout.notes || '',
              dayOffset: 0
            }], toast);
          } finally {
            setIsExporting(false);
          }
        }}
        warmup={workout.warmup}
        workout={workout.workout}
        notes={workout.notes}
        strength={workout.strength}
        allWorkouts={allWorkouts}
        onUpdate={(updates) => onUpdate(day, updates)}
      />
      
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Description</h3>
          <p className="text-muted-foreground text-sm sm:text-base">{workout.description}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
          <p className="text-muted-foreground whitespace-pre-line text-sm sm:text-base">{workout.warmup}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Workout</h3>
          <p className="text-muted-foreground whitespace-pre-line text-sm sm:text-base">{workout.workout}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
          <p className="text-muted-foreground text-sm sm:text-base">{workout.strength}</p>
        </div>
        
        {workout.notes && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
            <p className="text-muted-foreground text-sm sm:text-base">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
