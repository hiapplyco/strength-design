
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button 
        onClick={onGenerate}
        disabled={isGenerating || !isValid}
        className="w-full font-oswald uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
