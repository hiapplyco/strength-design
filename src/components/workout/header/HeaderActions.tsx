
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Send } from "lucide-react";

export interface HeaderActionsProps {
  isExporting: boolean;
  onExport: () => Promise<void>;
  onEdit?: () => void;  // Made optional since not all usages need it
  workoutText?: string; // Added to match usage in WorkoutDisplayHeader
  allWorkouts?: Record<string, any>; // Added to match usage in WorkoutDisplayHeader
}

export function HeaderActions({ 
  isExporting, 
  onExport, 
  onEdit,
  workoutText,
  allWorkouts 
}: HeaderActionsProps) {
  return (
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
        onClick={onExport}
        disabled={isExporting}
        className="relative"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md"></div>
          </>
        )}
      </Button>
    </div>
  );
}
