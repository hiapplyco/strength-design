
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Loader2 } from "lucide-react";

interface FileAnalysisStateProps {
  title: string;
  steps: string[];
}

export function FileAnalysisState({ title, steps }: FileAnalysisStateProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm mx-auto flex items-center gap-2">
      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
      <span className="text-xs text-amber-500 font-medium">{title}</span>
    </div>
  );
}
