
import { useState, useEffect } from "react";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { useLocation, useNavigate } from "react-router-dom";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMotivationalMessages } from "@/hooks/useMotivationalMessages";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { LoadingState } from "@/components/ui/loading-states/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutResults = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { isGenerating } = useWorkoutGeneration();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const { onWorkoutComplete } = useMotivationalMessages();

  useEffect(() => {
    const loadWorkouts = async () => {
      setIsLoading(true);
      
      // First try to get workouts from location state
      if (location.state?.workouts) {
        setWorkouts(location.state.workouts);
        console.log("Loaded workout data from location state");
        
        // Trigger motivational message for workout generation
        if (location.state?.isNewWorkout !== false) {
          onWorkoutComplete();
        }
        setIsLoading(false);
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
      
      setIsLoading(false);
    };
    
    loadWorkouts();
  }, [location.state, navigate, session, onWorkoutComplete, toast]);

  const resetWorkouts = () => {
    navigate("/workout-generator");
  };

  if (isLoading) {
    return (
      <StandardPageLayout
        title="Your Workout Plan"
        description="Loading your personalized workout..."
        showBack
        backUrl="/workout-generator"
      >
        <LoadingState
          variant="spinner"
          message="Loading workout data..."
          size="lg"
          className="min-h-[400px]"
        />
      </StandardPageLayout>
    );
  }

  if (!workouts) {
    return (
      <StandardPageLayout
        title="Your Workout Plan"
        showBack
        backUrl="/workout-generator"
      >
        <EmptyState
          icon={Dumbbell}
          title="No Workout Found"
          description="We couldn't find your workout plan. Let's create a new one!"
          action={
            <Button onClick={() => navigate("/workout-generator")}>
              Create New Workout
            </Button>
          }
          size="lg"
        />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Your Workout Plan"
      description="Your personalized weekly workout routine"
      showBack
      backUrl="/workout-generator"
      noPadding
    >
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
        isGenerating={isGenerating}
      />
    </StandardPageLayout>
  );
};

export default WorkoutResults;
