import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const { toast } = useToast();
  const [workoutDetails, setWorkoutDetails] = useState({
    Sunday: { warmup: "", wod: "", notes: "" },
    Monday: { warmup: "", wod: "", notes: "" },
    Tuesday: { warmup: "", wod: "", notes: "" },
    Wednesday: { warmup: "", wod: "", notes: "" },
    Thursday: { warmup: "", wod: "", notes: "" },
    Friday: { warmup: "", wod: "", notes: "" },
    Saturday: { warmup: "", wod: "", notes: "" },
  });

  const handleGenerateWorkout = async () => {
    if (!generatePrompt.trim() && showGenerateInput) {
      toast({
        title: "Error",
        description: "Please enter some context for the workout generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: { prompt: generatePrompt },
      });

      if (error) throw error;

      if (data) {
        setWorkoutDetails(data);
        
        const updatedWorkouts = workouts.map(workout => ({
          ...workout,
          description: data[workout.title].description || workout.description
        }));
        setWorkouts(updatedWorkouts);

        toast({
          title: "Success",
          description: "Weekly workouts have been generated!",
        });

        setShowGenerateInput(false);
        setGeneratePrompt("");
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate workouts",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleWorkoutUpdate = (day: string, updates: { warmup: string; wod: string; notes: string; }) => {
    setWorkoutDetails(prev => ({
      ...prev,
      [day]: updates
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-collegiate uppercase tracking-tight">Your Workouts</h1>
              <p className="text-muted-foreground mt-2">Stay consistent with your fitness journey</p>
            </div>
            <Button 
              onClick={() => setShowGenerateInput(!showGenerateInput)}
              className="border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {showGenerateInput ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate All Workouts
                </>
              )}
            </Button>
          </div>

          {showGenerateInput && (
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Enter context for workout generation (e.g., 'Focus on gymnastics this week' or 'Prepare for upcoming competition')"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                className="flex-1 border-2 border-primary"
              />
              <Button 
                onClick={handleGenerateWorkout} 
                disabled={isGenerating}
                className="border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 grid-cols-1">
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