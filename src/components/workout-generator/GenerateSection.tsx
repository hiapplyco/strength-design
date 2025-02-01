import { Send, Loader2, Check, X } from "lucide-react";
import { Button } from "../ui/button";

interface GenerateSectionProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  renderTooltip: () => React.ReactNode;
  isValid: boolean;
}

export function GenerateSection({ 
  onGenerate, 
  onClear,
  isGenerating,
  renderTooltip,
  isValid
}: GenerateSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Create Your Workout</h3>
        {renderTooltip()}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          onClick={() => {
            if (isValid && !isGenerating) {
              onGenerate();
            }
          }}
          disabled={isGenerating || !isValid}
          className={`w-full bg-primary text-primary-foreground hover:bg-primary/90 font-oswald uppercase tracking-wide transition-all duration-200 ${isGenerating ? 'opacity-75' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
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
          onClick={onClear}
          variant="outline"
          disabled={isGenerating}
          className="w-full hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
    </div>
  );
}