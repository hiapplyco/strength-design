import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { formatAllWorkouts } from "@/utils/workout-formatting";
import { exportToCalendar } from "@/utils/calendar";

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
    <Button
      onClick={handleExportToCalendar}
      disabled={isExporting}
      className="w-full sm:w-auto text-lg font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-4 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]"
    >
      <CalendarDays className="w-5 h-5 mr-2" />
      Export to Calendar
    </Button>
  );
}