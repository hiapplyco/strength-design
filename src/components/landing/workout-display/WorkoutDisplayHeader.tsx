import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExportActions } from "./ExportActions";

interface WorkoutDisplayHeaderProps {
  resetWorkouts: () => void;
  onExportCalendar: () => Promise<void>;
  onExportDocs: () => void;
  onExportExcel: () => void;
  onCopy: () => Promise<void>;
  isExporting: boolean;
  workoutText: string;
}

export const WorkoutDisplayHeader = ({
  resetWorkouts,
  onExportCalendar,
  onExportDocs,
  onExportExcel,
  onCopy,
  isExporting,
  workoutText
}: WorkoutDisplayHeaderProps) => {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2"
          onClick={resetWorkouts}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
        
        <ExportActions
          onExportCalendar={onExportCalendar}
          onExportDocs={onExportDocs}
          onExportExcel={onExportExcel}
          onCopy={onCopy}
          isExporting={isExporting}
          workoutText={workoutText}
        />
      </div>
    </div>
  );
};