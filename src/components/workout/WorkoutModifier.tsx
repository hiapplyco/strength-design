import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WorkoutDay } from "@/types/fitness";
import { Loader2, RefreshCw } from "lucide-react";

export interface WorkoutModifierProps {
  warmup: string;
  workout: string;
  notes?: string;
  strength: string;
  onClose: () => void;
  onUpdate: (updates: Partial<WorkoutDay>) => void;
  allWorkouts: Record<string, WorkoutDay>;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function WorkoutModifier({
  warmup,
  workout,
  notes,
  strength,
  onClose,
  onUpdate,
  allWorkouts,
  searchInputRef
}: WorkoutModifierProps) {
  return (
    <div className="space-y-2 border-4 border-destructive bg-destructive rounded-[20px] p-4">
      <Input
        placeholder={`Examples: "Make ${workout}'s workout easier", "Add more cardio", "Focus on strength", "Modify for knee injury"`}
        value={workout}
        onChange={(e) => onUpdate({ workout: e.target.value })}
        className="border-2 border-primary bg-white text-black placeholder:text-gray-400 rounded-[20px]"
      />
      <Button 
        onClick={() => onUpdate({ workout })}
        disabled={false}
        className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50 rounded-[20px]"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${false ? 'animate-spin' : ''}`} />
        {false ? 'Modifying...' : 'Modify Workout'}
      </Button>
    </div>
  );
}
