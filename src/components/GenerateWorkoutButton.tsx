import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GenerateWorkoutButtonProps {
  setShowGenerateInput: (value: boolean) => void;
}

export function GenerateWorkoutButton({ setShowGenerateInput }: GenerateWorkoutButtonProps) {
  return (
    <Button 
      onClick={() => setShowGenerateInput(true)}
      className="border-2 border-destructive bg-destructive text-white font-collegiate text-xl uppercase tracking-tight transition-colors hover:bg-destructiveSecondary hover:border-destructiveSecondary transform hover:-translate-y-1 hover:shadow-lg px-8 py-6"
    >
      <Plus className="mr-2 h-6 w-6" />
      Generate All Workouts
    </Button>
  );
}