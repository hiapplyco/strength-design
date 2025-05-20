
import { useState, useEffect } from "react";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { useLocation, useNavigate } from "react-router-dom";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutResults = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isGenerating } = useWorkoutGeneration();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // First try to get workouts from location state
    if (location.state?.workouts) {
      setWorkouts(location.state.workouts);
      console.log("Loaded workout data from location state");
      return;
    }
    
    // If no workouts in state, try to get from localStorage
    const storageKey = session?.user?.id 
      ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
      : WORKOUT_STORAGE_KEY;
      
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setWorkouts(parsedData);
        console.log("Loaded workout data from localStorage:", parsedData);
      } catch (error) {
        console.error("Error parsing stored workout data:", error);
        toast({
          title: "Error Loading Workout",
          description: "Could not load your workout data. Redirecting to generator.",
          variant: "destructive"
        });
        navigate("/workout-generator");
      }
    } else {
      // If no workouts in state or localStorage, redirect to generator
      console.log("No workout data found in localStorage or state, redirecting to generator");
      toast({
        title: "No Workouts Found",
        description: "No workouts were found. Create a new workout.",
        variant: "default"
      });
      navigate("/workout-generator");
    }
  }, [location.state, navigate, session]);

  const resetWorkouts = () => {
    navigate("/workout-generator");
  };

  if (!workouts) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", {
        "bg-gradient-to-br from-background via-background to-secondary/10": theme === "light",
        "bg-black": theme === "dark"
      })}>
        <p className="text-foreground text-xl">Loading workout data...</p>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", {
      "bg-gradient-to-br from-background via-background to-secondary/10": theme === "light"
    })}>
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default WorkoutResults;
