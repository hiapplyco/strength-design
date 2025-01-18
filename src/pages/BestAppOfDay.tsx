import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { GenerateWorkoutButton } from "@/components/GenerateWorkoutButton";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface WorkoutDetails {
  [key: string]: {
    warmup: string;
    wod: string;
    notes: string;
    strength: string;
    description?: string;
  };
}

const BestAppOfDay = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetails>({});
  const [showWorkouts, setShowWorkouts] = useState(false);
  const { toast } = useToast();
  const [workouts] = useState([
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
  ]);

  const handleGenerateWorkout = async () => {
    if (!generatePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter some context for workout generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: { prompt: generatePrompt },
      });

      if (error) {
        console.error('Error generating workouts:', error);
        throw error;
      }

      if (data) {
        setWorkoutDetails(data);
        setShowWorkouts(true);
        toast({
          title: "Success",
          description: "Weekly workouts have been generated!",
          className: "bg-primary text-primary-foreground border-none",
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setShowGenerateInput(false);
    }
  };

  const handleWorkoutUpdate = (title: string, updates: any) => {
    setWorkoutDetails(prev => ({
      ...prev,
      [title]: updates
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen flex flex-col">
      <Link 
        to="/" 
        className="text-primary hover:text-primary/80 inline-flex items-center gap-1 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all workouts
      </Link>
      
      <div className="flex-1 flex items-center">
        <div className="flex flex-col space-y-8 max-w-3xl mx-auto w-full">
          <div className="flex flex-col space-y-4">
            <div className="text-center">
              <h1 className="text-7xl font-collegiate uppercase tracking-tight text-destructive transform -skew-x-12 mb-2">
                Your Workouts
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Built by Apply, Co.</p>
            </div>
            
            <div className="flex items-center justify-center w-full mt-6">
              {showGenerateInput ? (
                <GenerateWorkoutInput
                  generatePrompt={generatePrompt}
                  setGeneratePrompt={setGeneratePrompt}
                  handleGenerateWorkout={handleGenerateWorkout}
                  isGenerating={isGenerating}
                  setShowGenerateInput={setShowGenerateInput}
                />
              ) : (
                <GenerateWorkoutButton setShowGenerateInput={setShowGenerateInput} />
              )}
            </div>
          </div>

          {showWorkouts && (
            <div className="grid gap-8 md:gap-12 grid-cols-1">
              {workouts.map((workout) => (
                <WorkoutCard 
                  key={workout.title} 
                  {...workout} 
                  allWorkouts={workoutDetails}
                  onUpdate={(updates) => handleWorkoutUpdate(workout.title, updates)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BestAppOfDay;