
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WorkoutDisplayButtonsProps {
  resetWorkouts: () => void;
}

export const WorkoutDisplayButtons = ({ resetWorkouts }: WorkoutDisplayButtonsProps) => {
  return (
    <Button
      onClick={resetWorkouts}
      className="h-auto text-base sm:text-lg font-medium text-white rounded-md px-3 py-1.5 sm:px-4 sm:py-2 
        shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
    >
      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      Back
    </Button>
  );
};
