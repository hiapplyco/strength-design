import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    toast({
      title: "Workout Generated!",
      description: "Your new workout plan is ready.",
    });
  };

  const workouts = [
    {
      title: "Sunday",
      description: "Rest and recovery day with mobility work and light stretching.",
      duration: "30 minutes",
    },
    {
      title: "Monday",
      description: "Strength focus with compound movements and accessory work.",
      duration: "60 minutes",
    },
    {
      title: "Tuesday",
      description: "High-intensity cardio and bodyweight exercises.",
      duration: "45 minutes",
    },
    {
      title: "Wednesday",
      description: "Olympic weightlifting technique and skill work.",
      duration: "60 minutes",
    },
    {
      title: "Thursday",
      description: "Endurance-based workout with mixed modal activities.",
      duration: "50 minutes",
    },
    {
      title: "Friday",
      description: "Strength and power development with heavy lifts.",
      duration: "60 minutes",
    },
    {
      title: "Saturday",
      description: "Team workout with partner exercises and fun challenges.",
      duration: "45 minutes",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-collegiate uppercase tracking-tight">Your Workouts</h1>
            <p className="text-muted-foreground mt-2">Stay consistent with your fitness journey</p>
          </div>
          <Button onClick={handleGenerateWorkout} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate All Workouts
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.title} {...workout} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;