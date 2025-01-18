import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutGenerationFormProps {
  onWorkoutsGenerated: (workoutData: any, descriptions: any) => void;
}

export function WorkoutGenerationForm({ onWorkoutsGenerated }: WorkoutGenerationFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expertiseArea, setExpertiseArea] = useState("");
  const { toast } = useToast();

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
      // Mock data for demonstration
      const mockWorkoutData = {
        Sunday: {
          warmup: "Light stretching and mobility work",
          wod: "Rest day - Focus on recovery",
          notes: "Use this time for meditation and mental preparation",
          description: "Recovery and mobility focus"
        },
        Monday: {
          warmup: "Dynamic stretching and joint mobility",
          wod: `${expertiseArea} fundamentals practice`,
          notes: "Focus on proper form and technique",
          description: "Fundamental skill development"
        },
        // ... Add more mock data for other days
      };

      onWorkoutsGenerated(mockWorkoutData, mockWorkoutData);
      toast({
        title: "Success",
        description: `Your ${expertiseArea} expertise journey has been generated!`,
        className: "bg-primary text-primary-foreground border-none",
      });
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
  );
}