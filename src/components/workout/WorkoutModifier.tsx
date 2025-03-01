
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WorkoutDay } from "@/types/fitness";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorkoutModifierProps {
  warmup: string;
  workout: string;
  notes?: string;
  strength: string;
  onClose: () => void;
  onUpdate: (updates: Partial<WorkoutDay>) => void;
  allWorkouts: Record<string, WorkoutDay>;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  day?: string;
}

export function WorkoutModifier({
  warmup,
  workout,
  notes,
  strength,
  onClose,
  onUpdate,
  allWorkouts,
  searchInputRef,
  day
}: WorkoutModifierProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const { toast } = useToast();

  const handleModifyWorkout = async () => {
    if (!modificationPrompt) {
      toast({
        title: "Please enter a modification request",
        variant: "destructive",
      });
      return;
    }

    setIsModifying(true);

    try {
      const currentWorkout = {
        warmup,
        workout,
        notes,
        strength,
      };

      console.log('Sending modification request:', {
        dayToModify: day,
        currentWorkout,
        modificationPrompt,
        allWorkouts,
      });

      const { data, error } = await supabase.functions.invoke('workout-modifier', {
        body: {
          dayToModify: day,
          currentWorkout,
          modificationPrompt,
          allWorkouts,
        },
      });

      if (error) throw error;

      if (data) {
        console.log('Modification response:', data);
        onUpdate({
          warmup: data.warmup,
          workout: data.workout,
          notes: data.notes,
          strength: data.strength
        });
        
        toast({
          title: "Workout Modified",
          description: "Your workout has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error modifying workout:', error);
      toast({
        title: "Error",
        description: "Failed to modify workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsModifying(false);
      onClose();
    }
  };

  return (
    <div className="space-y-3 bg-card/90 backdrop-blur-sm border-2 border-primary/40 rounded-lg p-5 shadow-lg animate-in fade-in duration-300">
      <Input
        placeholder="How would you like to modify this workout?"
        value={modificationPrompt}
        onChange={(e) => setModificationPrompt(e.target.value)}
        className="border border-primary/30 bg-background/80 text-foreground placeholder:text-muted-foreground"
      />
      <Button 
        onClick={handleModifyWorkout}
        disabled={isModifying}
        className="w-full"
        variant="default"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isModifying ? 'animate-spin' : ''}`} />
        {isModifying ? 'Modifying...' : 'Modify Workout'}
      </Button>
    </div>
  );
}
