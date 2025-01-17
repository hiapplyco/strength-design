import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X } from "lucide-react";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: () => void;
  isGenerating: boolean;
  setShowGenerateInput: (value: boolean) => void;
}

export function GenerateWorkoutInput({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setShowGenerateInput,
}: GenerateWorkoutInputProps) {
  return (
    <div className="flex flex-col sm:flex-row w-full max-w-3xl mx-auto gap-4">
      <Input
        placeholder="e.g., 'Focus on Olympic lifts this cycle, with emphasis on technique and progressive loading'"
        value={generatePrompt}
        onChange={(e) => setGeneratePrompt(e.target.value)}
        className="flex-1 border-2 border-primary bg-white text-black placeholder:text-gray-500"
      />
      <div className="flex gap-2 sm:gap-4">
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
              Generate
            </>
          )}
        </Button>
        <Button 
          onClick={() => setShowGenerateInput(false)}
          variant="outline"
          className="border-2 border-primary text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}