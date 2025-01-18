import { useState } from "react";
import { HeaderSection } from "@/components/header/HeaderSection";
import { WorkoutGenerationForm } from "@/components/workout/WorkoutGenerationForm";
import { WorkoutList } from "@/components/workout/WorkoutList";

interface WorkoutDetails {
  [key: string]: {
    warmup: string;
    wod: string;
    notes: string;
    strength: string;
    description?: string;
  };
}

const Index = () => {
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetails>({});
  const [showWorkouts, setShowWorkouts] = useState(false);
  const [workouts, setWorkouts] = useState([
    {
      title: "Sunday",
      description: "Rest and recovery focused on mobility and flexibility.",
      duration: "30-45 minutes",
    },
    {
      title: "Monday",
      description: "Foundational skill development and technique work.",
      duration: "45-60 minutes",
    },
    {
      title: "Tuesday",
      description: "Progressive skill application and practice.",
      duration: "45-60 minutes",
    },
    {
      title: "Wednesday",
      description: "Advanced technique refinement and mastery.",
      duration: "60 minutes",
    },
    {
      title: "Thursday",
      description: "Skill integration and flow practice.",
      duration: "50 minutes",
    },
    {
      title: "Friday",
      description: "Performance enhancement and advanced applications.",
      duration: "60 minutes",
    },
    {
      title: "Saturday",
      description: "Practice sessions and skill assessment.",
      duration: "45-60 minutes",
    },
  ]);

  const handleWorkoutsGenerated = (data: WorkoutDetails, descriptions: any) => {
    setWorkoutDetails(data);
    setWorkouts(prevWorkouts => 
      prevWorkouts.map(workout => ({
        ...workout,
        description: descriptions[workout.title]?.description || workout.description
      }))
    );
    setShowWorkouts(true);
  };

  const handleWorkoutUpdate = (updates: any) => {
    setWorkoutDetails(prev => ({
      ...prev,
      [updates.title]: updates
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen flex flex-col">
      <HeaderSection />
      
      <div className="flex-1 flex items-center">
        <div className="flex flex-col space-y-8 max-w-3xl mx-auto w-full">
          <div className="flex flex-col space-y-4">
            <div className="text-center">
              <h1 className="text-7xl font-collegiate uppercase tracking-tight text-destructive transform -skew-x-12 mb-2">
                Master Your Craft
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Built by Apply, Co.</p>
            </div>
            
            <WorkoutGenerationForm onWorkoutsGenerated={handleWorkoutsGenerated} />
          </div>

          {showWorkouts && (
            <WorkoutList 
              workouts={workouts}
              workoutDetails={workoutDetails}
              onWorkoutUpdate={handleWorkoutUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Index;