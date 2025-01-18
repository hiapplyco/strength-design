import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Dumbbell, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ExerciseSearch } from "@/components/ExerciseSearch";
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
        body: { prompt: expertiseArea }
      });

      if (error) {
        throw error;
      }

      if (data) {
        setWorkoutDetails(data);
        setShowWorkouts(true);
        toast({
          title: "Success",
          description: `Your ${expertiseArea} expertise journey has been generated!`,
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
    <div className="container mx-auto px-4 py-8 animate-fade-in bg-background min-h-screen">
      <ExerciseSearch />
      <div className="absolute top-4 right-4 max-w-md text-right">
        <Link to="/best-app-of-day" className="text-primary hover:underline font-bold inline-flex items-center">
          Check out our CrossFit focused builder→
        </Link>
        <p className="text-sm text-muted-foreground mt-2">
          CrossFit's unique blend of complex movements and intense metrics inspired our journey.
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-16 pt-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl">
          <h1 className="text-7xl font-collegiate uppercase tracking-tight text-destructive transform -skew-x-12 mb-4">
            Master Your Craft
          </h1>
          <p className="text-xl text-destructive">
            Hyper-Refined Training Programs That Adapt To Your Athletes
          </p>
          <p className="text-muted-foreground mt-2">Built by Apply, Co.</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border-2 border-primary">
            <Dumbbell className="w-12 h-12 text-black mb-4" />
            <h3 className="text-xl font-bold mb-2 text-destructive">Adaptive Programming</h3>
            <p className="text-destructiveSecondary">Precision-crafted weekly programs that evolve with your athletes</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border-2 border-primary">
            <Target className="w-12 h-12 text-black mb-4" />
            <h3 className="text-xl font-bold mb-2 text-destructive">Elite Methodology</h3>
            <p className="text-destructiveSecondary">Data-driven coaching adapted to specific performance goals</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border-2 border-primary">
            <Trophy className="w-12 h-12 text-black mb-4" />
            <h3 className="text-xl font-bold mb-2 text-destructive">Performance Mastery</h3>
            <p className="text-destructiveSecondary">Strategic progression from fundamentals to advanced techniques</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Start Your Journey</h2>
            <p className="text-destructiveSecondary">
              Enter your training focus and receive a tailored program built for excellence
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full gap-4">
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

        {/* Workout Cards */}
        {showWorkouts && (
          <div className="grid gap-8 md:gap-12 grid-cols-1 w-full">
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
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Index;