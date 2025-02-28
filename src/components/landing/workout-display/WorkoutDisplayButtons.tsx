
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WorkoutDisplayButtonsProps {
  resetWorkouts: () => void;
}

export const WorkoutDisplayButtons = ({ resetWorkouts }: WorkoutDisplayButtonsProps) => {
  return (
    <Button
      onClick={resetWorkouts}
      className="h-auto text-base sm:text-lg font-oswald font-bold text-black dark:text-white 
        transform -skew-x-12 uppercase tracking-wider text-center border-[2px] sm:border-[3px] 
        border-black rounded-md px-3 py-1.5 sm:px-4 sm:py-2 
        shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),3px_3px_0px_0px_#C4A052,6px_6px_0px_0px_rgba(0,0,0,1)] 
        hover:shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] 
        transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E] flex items-center gap-2"
    >
      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      Back
    </Button>
  );
};
