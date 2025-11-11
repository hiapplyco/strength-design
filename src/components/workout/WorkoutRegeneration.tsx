import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";

interface WorkoutRegenerationProps {
  workout: {
    id: string;
    day: string;
    warm_up: string;
    wod: string;
    notes?: string;
  };
  onChange: (key: string, value: string) => void;
}

export function WorkoutRegeneration({ workout, onChange }: WorkoutRegenerationProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    if (!userPrompt) {
      toast({
        title: "Please enter a prompt",
        description: "Describe how you'd like to modify the workout",
        variant: "destructive",
      });
      return;
    }

    setIsRegenerating(true);

    try {
      const regenerateWorkout = httpsCallable(functions, 'regenerateWorkout');
      const result = await regenerateWorkout({
        dayToModify: workout.day,
        modificationPrompt: userPrompt,
        currentWorkout: {
          warmup: workout.warm_up,
          workout: workout.wod,
          notes: workout.notes || ''
        }
      });

      const data = result.data as any;

      if (data) {
        // Map camelCase response to snake_case fields
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string') {
            switch(key) {
              case 'warmup':
                onChange('warm_up', value);
                break;
              case 'workout':
                onChange('wod', value);
                break;
              case 'notes':
                onChange('notes', value);
                break;
              // Ignore other fields like 'description' that we don't need
            }
          }
        });

        setUserPrompt("");
        toast({
          title: "Success",
          description: `${workout.day}'s workout updated successfully!`,
        });
      }
    } catch (error) {
      console.error('Error regenerating workout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Describe how you'd like to modify this workout..."
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        className="min-h-[100px] bg-white text-black placeholder:text-gray-500"
      />
      <Button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isRegenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Regenerating...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Workout
          </>
        )}
      </Button>
    </div>
  );
}