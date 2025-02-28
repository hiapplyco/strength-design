
import React from "react";
import { Button } from "../ui/button";
import { Send, Loader2, Check, X } from "lucide-react";
import type { ActionButtonsProps } from "./types";

export function ActionButtons({
  onGenerate,
  onClear,
  isGenerating,
  isValid
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <Button 
        onClick={onGenerate}
        disabled={isGenerating || !isValid}
        className="w-full py-3 bg-primary text-black font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            GENERATE
          </>
        )}
      </Button>
      
      <Button 
        onClick={onClear}
        variant="outline"
        disabled={isGenerating}
        className="w-full py-3 bg-transparent text-white font-medium border border-red-500/50 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="h-4 w-4 mr-2" />
        Clear All
      </Button>
    </div>
  );
}
