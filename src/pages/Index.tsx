import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [expertiseArea, setExpertiseArea] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState<WorkoutDetails>({});
  const [showWorkouts, setShowWorkouts] = useState(false);
  const { toast } = useToast();
  const [workouts] = useState([
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

  const persistWorkouts = async (workoutData: WorkoutDetails) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      return;
    }

    // Delete existing workouts for this user
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting existing workouts:', deleteError);
      return;
    }

    // Insert new workouts
    for (const [title, details] of Object.entries(workoutData)) {
      const { error: insertError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          day: title,
          warmup: details.warmup,
          wod: details.wod,
          notes: details.notes
        });

      if (insertError) {
        console.error(`Error inserting workout for ${title}:`, insertError);
      }
    }
  };

  const handleGenerateWorkout = async () => {
    if (!expertiseArea.trim()) {
      toast({
        title: "Error",
        description: "Please enter your desired area of expertise",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: { 
          prompt: `Create a comprehensive progression plan for someone wanting to become an expert in ${expertiseArea}. 
                  Focus on proper skill development, gradually increasing complexity, and building a strong foundation.
                  Include specific drills, techniques, and progressions unique to ${expertiseArea}.`
        },
      });

      if (error) throw error;

      if (data) {
        setWorkoutDetails(data);
        await persistWorkouts(data);
        setShowWorkouts(true);
        toast({
          title: "Success",
          description: `Your ${expertiseArea} expertise journey has been generated and saved!`,
          className: "bg-primary text-primary-foreground border-none",
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate expertise plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen flex flex-col">
      <div className="absolute top-4 right-0 pr-4">
        <Link to="/best-app-of-day" className="text-primary hover:underline font-bold inline-flex items-center">
          Check out our CrossFit focused builder→
        </Link>
        <p className="text-sm text-muted-foreground mt-2 max-w-md text-right">
          CrossFit's unique blend of complex movements and intense metrics inspired our journey, shaping how we approach progression in all domains.
        </p>
      </div>
      
      <div className="flex-1 flex items-center">
        <div className="flex flex-col space-y-8 max-w-3xl mx-auto w-full">
          <div className="flex flex-col space-y-4">
            <div className="text-center">
              <h1 className="text-7xl font-collegiate uppercase tracking-tight text-destructive transform -skew-x-12 mb-2">
                Master Your Craft
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Built by Apply, Co.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full max-w-3xl mx-auto gap-4">
              <Input
                placeholder="Enter your desired expertise area (e.g., Yoga, Calisthenics, Olympic Lifting)"
                value={expertiseArea}
                onChange={(e) => setExpertiseArea(e.target.value)}
                className="flex-1 border-2 border-primary bg-white text-black placeholder:text-gray-500"
              />
              <Button 
                onClick={handleGenerateWorkout}
                disabled={isGenerating}
                className="flex-1 sm:flex-none border-2 border-primary bg-card text-primary font-bold uppercase tracking-tight transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50 whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>

          {showWorkouts && (
            <div className="grid gap-8 md:gap-12 grid-cols-1">
              {workouts.map((workout) => (
                <WorkoutCard 
                  key={workout.title} 
                  {...workout} 
                  allWorkouts={workoutDetails}
                  onUpdate={(updates) => {
                    const newWorkoutDetails = {
                      ...workoutDetails,
                      [workout.title]: updates
                    };
                    setWorkoutDetails(newWorkoutDetails);
                    persistWorkouts(newWorkoutDetails);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Index;