
import { Check, X } from "lucide-react";

interface ActionButtonsProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  isValid: boolean;
}

export function ActionButtons({ 
  onGenerate, 
  onClear, 
  isGenerating, 
  isValid 
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <button
        onClick={onGenerate}
        disabled={isGenerating || !isValid}
        className="relative w-full py-3 flex justify-center items-center bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 -z-10"></div>
        {isGenerating ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </span>
        ) : (
          <span className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            GENERATE
          </span>
        )}
      </button>
      
      <button
        onClick={onClear}
        disabled={isGenerating}
        className="w-full py-3 flex justify-center items-center bg-transparent text-white font-medium rounded-lg border border-red-500/50 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="h-4 w-4 mr-2" />
        Clear All
      </button>
    </div>
  );
}
