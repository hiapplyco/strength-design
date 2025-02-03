import { useToast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";
import { formatAllWorkouts } from "@/utils/workout-formatting";
import { exportToCalendar } from "@/utils/calendar";
import { StyledHeaderButton } from "./StyledHeaderButton";

interface HeaderActionsProps {
  onExport: () => void;
  isExporting: boolean;
  workoutText: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
}

export function HeaderActions({
  onExport,
  isExporting,
  allWorkouts,
}: HeaderActionsProps) {
  const { toast } = useToast();

  const handleExportToCalendar = async () => {
    if (!allWorkouts) return;

    const events = Object.entries(allWorkouts).map(([day, workout], index) => ({
      title: `Day ${index + 1}`,
      warmup: workout.warmup,
      workout: workout.workout,
      notes: workout.notes || '',
      dayOffset: index,
    }));

    try {
      await exportToCalendar(events, toast);
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      toast({
        title: "Error",
        description: "Failed to export to calendar",
        variant: "destructive",
      });
    }
  };

  return (
    <StyledHeaderButton
      onClick={handleExportToCalendar}
      disabled={isExporting}
    >
      <CalendarDays className="w-5 h-5 mr-2" />
      Export to Calendar
    </StyledHeaderButton>
  );
}