
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
    <div className="space-y-2 border-4 border-primary bg-black/70 rounded-[20px] p-4 animate-scale-in">
      <Input
        placeholder={`Examples: "Make the workout easier", "Add more cardio", "Focus on strength", "Modify for knee injury"`}
        value={modificationPrompt}
        onChange={(e) => setModificationPrompt(e.target.value)}
        className="border-2 border-primary bg-white text-black placeholder:text-gray-400 rounded-[20px]"
      />
      <Button 
        onClick={handleModifyWorkout}
        disabled={isModifying}
        className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50 rounded-[20px]"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isModifying ? 'animate-spin' : ''}`} />
        {isModifying ? 'Modifying...' : 'Modify Workout'}
      </Button>
    </div>
  );
}
