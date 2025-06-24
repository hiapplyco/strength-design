
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { exportToCalendar } from "@/utils/calendar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { WeeklyWorkouts, WorkoutDay, WorkoutCycle } from "@/types/fitness";
import { isWorkoutDay, isWorkoutCycle } from "@/types/fitness";

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workouts: WeeklyWorkouts;
}

export const CalendarExportDialog = ({ open, onOpenChange, workouts }: CalendarExportDialogProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const prepareWorkoutEvents = () => {
    const events: Array<{
      title: string;
      warmup: string;
      workout: string;
      notes: string;
      dayOffset: number;
      workoutData: WorkoutDay;
    }> = [];

    let dayOffset = 0;

    Object.entries(workouts)
      .filter(([key]) => key !== '_meta')
      .forEach(([key, value]) => {
        if (isWorkoutCycle(value)) {
          const cycleTitle = key.charAt(0).toUpperCase() + key.slice(1);
          
          Object.entries(value as WorkoutCycle)
            .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
            .forEach(([dayKey, dayValue]) => {
              const workoutDay = dayValue as WorkoutDay;
              const formattedDay = dayKey.replace(/day(\d+)/, 'Day $1');
              
              events.push({
                title: `${cycleTitle} - ${formattedDay}`,
                warmup: workoutDay.warmup || '',
                workout: workoutDay.workout || '',
                notes: workoutDay.notes || '',
                dayOffset: dayOffset++,
                workoutData: workoutDay
              });
            });
        } else if (isWorkoutDay(value)) {
          const workoutDay = value as WorkoutDay;
          const formattedDay = key.replace(/day(\d+)/, 'Day $1');
          
          events.push({
            title: formattedDay,
            warmup: workoutDay.warmup || '',
            workout: workoutDay.workout || '',
            notes: workoutDay.notes || '',
            dayOffset: dayOffset++,
            workoutData: workoutDay
          });
        }
      });

    return events;
  };

  const saveWorkoutSessions = async (startDate: Date, events: ReturnType<typeof prepareWorkoutEvents>) => {
    if (!session?.user?.id) return;

    try {
      // First, create a generated_workouts entry
      const { data: generatedWorkout, error: workoutError } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          workout_data: workouts,
          title: workouts._meta?.title || 'Exported Workout Plan',
          summary: workouts._meta?.summary || '',
          tags: ['exported']
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create workout sessions for each day
      const workoutSessions = events.map(event => {
        const scheduledDate = addDays(startDate, event.dayOffset);
        return {
          user_id: session.user.id,
          generated_workout_id: generatedWorkout.id,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          status: 'scheduled' as const,
          notes: `${event.title}\n\nWarmup: ${event.warmup}\n\nWorkout: ${event.workout}\n\nNotes: ${event.notes}`
        };
      });

      const { error: sessionsError } = await supabase
        .from('workout_sessions')
        .insert(workoutSessions);

      if (sessionsError) throw sessionsError;

      return true;
    } catch (error) {
      console.error('Error saving workout sessions:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    if (!startDate) {
      toast({
        title: "Date Required",
        description: "Please select a start date for your workout plan.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      const events = prepareWorkoutEvents();
      
      // Save to database first
      await saveWorkoutSessions(startDate, events);
      
      // Then export to calendar
      const calendarEvents = events.map(event => ({
        ...event,
        dayOffset: event.dayOffset
      }));

      await exportToCalendar(calendarEvents, toast);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: `Your workout plan has been exported and saved to your schedule starting ${format(startDate, 'PPP')}`,
      });
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast({
        title: "Error",
        description: "Failed to export workout plan to calendar",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const workoutCount = prepareWorkoutEvents().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Export & Schedule Workouts
          </DialogTitle>
          <DialogDescription>
            Export your {workoutCount} workout{workoutCount !== 1 ? 's' : ''} to your calendar and save them to your fitness journal. 
            Choose when you'd like to start your workout plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!startDate || isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Export & Schedule {workoutCount} Workout{workoutCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
