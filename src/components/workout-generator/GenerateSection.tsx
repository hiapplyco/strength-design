import { Send, Loader2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface GenerateSectionProps {
  generatePrompt: string;
  onGeneratePromptChange: (value: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
}

export function GenerateSection({ 
  generatePrompt, 
  onGeneratePromptChange, 
  onGenerate, 
  onClear,
  isGenerating 
}: GenerateSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Send className="h-5 w-5" />
        <h3 className="font-oswald text-lg uppercase">Generate Workout</h3>
      </div>
      <Input
        placeholder="e.g., 'Focus on Olympic lifts this cycle, with emphasis on technique and progressive loading'"
        value={generatePrompt}
        onChange={(e) => onGeneratePromptChange(e.target.value)}
        className="bg-white text-black placeholder:text-gray-500"
      />
      
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="flex-1 min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90 font-oswald uppercase tracking-wide transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Generate Workout
            </>
          )}
        </Button>
        <Button 
          onClick={onClear}
          variant="outline"
          className="flex-shrink-0 hover:bg-destructive/10"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
    </div>
  );
}