
import { useState, useEffect } from "react";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { useLocation, useNavigate } from "react-router-dom";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutResults = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isGenerating } = useWorkoutGeneration();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    // First try to get workouts from location state
    if (location.state?.workouts) {
      setWorkouts(location.state.workouts);
      return;
    }
    
    // If no workouts in state, try to get from localStorage
    const storedData = localStorage.getItem(
      session?.user?.id 
        ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
        : WORKOUT_STORAGE_KEY
    );
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setWorkouts(parsedData);
      } catch (error) {
        console.error("Error parsing stored workout data:", error);
        navigate("/workout-generator");
      }
    } else {
      // If no workouts in state or localStorage, redirect to generator
      navigate("/workout-generator");
    }
  }, [location.state, navigate, session]);

  const resetWorkouts = () => {
    navigate("/workout-generator");
  };

  if (!workouts) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-xl">Loading workout data...</p>
    </div>;
  }

  return (
    <WorkoutDisplay
      workouts={workouts}
      resetWorkouts={resetWorkouts}
      isExporting={isExporting}
      setIsExporting={setIsExporting}
      isGenerating={isGenerating}
    />
  );
};

export default WorkoutResults;
