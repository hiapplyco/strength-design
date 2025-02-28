
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface WorkoutDisplayButtonsProps {
  resetWorkouts: () => void;
}

export const WorkoutDisplayButtons = ({ resetWorkouts }: WorkoutDisplayButtonsProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const handleBackClick = () => {
    // Clear any saved workout data from localStorage
    const WORKOUT_STORAGE_KEY = "strength_design_current_workout";
    localStorage.removeItem(
      session?.user?.id 
        ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
        : WORKOUT_STORAGE_KEY
    );
    
    // Call the resetWorkouts function passed as prop
    resetWorkouts();
    
    // Navigate back to the workout generator page
    navigate("/workout-generator");
  };

  return (
    <Button
      onClick={handleBackClick}
      className="h-auto text-base sm:text-lg font-medium text-white rounded-md px-3 py-1.5 sm:px-4 sm:py-2 
        shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
      variant="outline"
    >
      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      Back to Generator
    </Button>
  );
};
