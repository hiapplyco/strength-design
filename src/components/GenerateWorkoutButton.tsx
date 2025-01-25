import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface GenerateWorkoutButtonProps {
  setShowGenerateInput: (value: boolean) => void;
  isGenerating?: boolean;
}

export function GenerateWorkoutButton({ setShowGenerateInput, isGenerating }: GenerateWorkoutButtonProps) {
  return (
    <Button 
      onClick={() => setShowGenerateInput(true)}
      disabled={isGenerating}
      className="border-2 border-destructive bg-destructive text-white font-collegiate text-xl uppercase tracking-tight transition-colors hover:bg-destructiveSecondary hover:border-destructiveSecondary transform hover:-translate-y-1 hover:shadow-lg px-8 py-6"
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
      ) : (
        <Plus className="mr-2 h-6 w-6" />
      )}
      Generate All Workouts
    </Button>
  );
}