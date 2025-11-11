
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, CalendarIcon } from "lucide-react";
import { CalendarExportDialog } from "../calendar/CalendarExportDialog";
import type { WeeklyWorkouts } from "@/types/fitness";

export interface HeaderActionsProps {
  isExporting: boolean;
  onExport: () => Promise<void>;
  onEdit?: () => void;
  workoutText?: string;
  allWorkouts?: WeeklyWorkouts;
}

export function HeaderActions({ 
  isExporting, 
  onExport, 
  onEdit,
  workoutText,
  allWorkouts 
}: HeaderActionsProps) {
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);

  const handleCalendarClick = () => {
    if (allWorkouts) {
      setShowCalendarDialog(true);
    } else {
      // Fallback to old export method if no allWorkouts
      onExport();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
            className="relative"
          >
            <Edit className="h-4 w-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md"></div>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCalendarClick}
          disabled={isExporting}
          className="relative"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CalendarIcon className="h-4 w-4" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md"></div>
            </>
          )}
        </Button>
      </div>

      {allWorkouts && (
        <CalendarExportDialog
          open={showCalendarDialog}
          onOpenChange={setShowCalendarDialog}
          workouts={allWorkouts}
        />
      )}
    </>
  );
}
