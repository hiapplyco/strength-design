import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

interface WorkoutModifierProps {
  title: string;
  modificationPrompt: string;
  isModifying: boolean;
  onModificationPromptChange: (value: string) => void;
  onModify: (modificationPrompt: string) => void; // Updated to match the expected signature
}

export function WorkoutModifier({
  title,
  modificationPrompt,
  isModifying,
  onModificationPromptChange,
  onModify
}: WorkoutModifierProps) {
  return (
    <div className="space-y-2 border-4 border-destructive bg-destructive rounded-[20px] p-4">
      <Input
        placeholder={`Examples: "Make ${title}'s workout easier", "Add more cardio", "Focus on strength", "Modify for knee injury"`}
        value={modificationPrompt}
        onChange={(e) => onModificationPromptChange(e.target.value)}
        className="border-2 border-primary bg-white text-black placeholder:text-gray-400 rounded-[20px]"
      />
      <Button 
        onClick={() => onModify(modificationPrompt)} // Updated to pass the modificationPrompt
        disabled={isModifying}
        className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50 rounded-[20px]"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isModifying ? 'animate-spin' : ''}`} />
        {isModifying ? 'Modifying...' : 'Modify Workout'}
      </Button>
    </div>
  );
}