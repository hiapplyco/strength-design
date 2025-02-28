
import { useState, useEffect } from "react";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { useLocation, useNavigate } from "react-router-dom";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";

const WorkoutResults = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isGenerating } = useWorkoutGeneration();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get workouts from location state
    if (location.state?.workouts) {
      setWorkouts(location.state.workouts);
    } else {
      // If no workouts in state, redirect back to generator
      navigate("/workout-generator");
    }
  }, [location.state, navigate]);

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
