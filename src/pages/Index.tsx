import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Plus, Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { GenerateWorkoutButton } from "@/components/GenerateWorkoutButton";
import { sanitizeText } from "@/utils/text";

interface WorkoutDetails {
  [key: string]: {
    warmup: string;
    wod: string;
    notes: string;
    description?: string;
  };
}

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetails>({});
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState([
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
    if (!generatePrompt.trim() && showGenerateInput) {
      toast({
        title: "Error",
        description: "Please enter some context for workout generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const sanitizedPrompt = sanitizeText(generatePrompt);
      console.log('Calling generate-weekly-workouts with prompt:', sanitizedPrompt);
      
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: { prompt: sanitizedPrompt },
      });

      if (error) {
        console.error('Error generating workouts:', error);
        throw error;
      }

      if (data) {
        console.log('Received workout data:', data);
        
        // Create a new workout details object with the received data
        const newWorkoutDetails: WorkoutDetails = {};
        Object.entries(data).forEach(([day, workout]: [string, any]) => {
          newWorkoutDetails[day] = {
            warmup: sanitizeText(workout.warmup || ''),
            wod: sanitizeText(workout.wod || ''),
            notes: sanitizeText(workout.notes || ''),
            description: sanitizeText(workout.description || ''),
          };
        });
        
        setWorkoutDetails(newWorkoutDetails);
        
        const updatedWorkouts = workouts.map(workout => ({
          ...workout,
          description: data[workout.title]?.description || workout.description
        }));
        setWorkouts(updatedWorkouts);

        toast({
          title: "Success",
          description: "Weekly workouts have been generated!",
          className: "bg-primary text-primary-foreground border-none",
        });

        setShowGenerateInput(false);
        setGeneratePrompt("");
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate workouts. Please try again.",
        variant: "destructive",
        className: "bg-destructive text-destructive-foreground border-none",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWorkoutUpdate = (day: string, updates: { warmup: string; wod: string; notes: string; }) => {
    setWorkoutDetails(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...updates
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="text-center">
            <h1 className="text-7xl font-collegiate uppercase tracking-tight text-destructive transform -skew-x-12 mb-2">
              Your Workouts
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Stay consistent with your fitness journey</p>
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
      </div>
    </div>
  );
};

export default Index;
