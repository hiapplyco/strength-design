
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";

interface AutoRegenerationOptions {
  enabled: boolean;
  delayMs: number;
  onRegenerate: (content: string) => Promise<void>;
}

export const useAutoRegeneration = (
  content: string,
  options: AutoRegenerationOptions
) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastProcessedContent, setLastProcessedContent] = useState(content);
  const { toast } = useToast();
  
  // Debounce content changes
  const debouncedContent = useDebounce(content, options.delayMs);

  const regenerateNarration = useCallback(async (newContent: string) => {
    if (!options.enabled || isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      await options.onRegenerate(newContent);
      setLastProcessedContent(newContent);
      
      toast({
        title: "Narration Updated",
        description: "Your script has been automatically regenerated.",
      });
    } catch (error) {
      console.error('Auto-regeneration failed:', error);
      toast({
        title: "Auto-regeneration Failed",
        description: "Failed to update narration automatically. Try manually regenerating.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [options.enabled, options.onRegenerate, isRegenerating, toast]);

  // Auto-regenerate when content changes
  useEffect(() => {
    if (
      options.enabled &&
      debouncedContent &&
      debouncedContent !== lastProcessedContent &&
      debouncedContent.trim().length > 0
    ) {
      regenerateNarration(debouncedContent);
    }
  }, [debouncedContent, lastProcessedContent, regenerateNarration, options.enabled]);

  return {
    isRegenerating,
    regenerateNarration: (content: string) => regenerateNarration(content)
  };
};
