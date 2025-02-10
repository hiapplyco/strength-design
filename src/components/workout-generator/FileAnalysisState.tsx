
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface FileAnalysisStateProps {
  title: string;
  steps: string[];
}

export function FileAnalysisState({ title, steps }: FileAnalysisStateProps) {
  return (
    <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-md shadow-sm max-w-[600px] mx-auto">
      <LoadingIndicator className="py-2">
        <h3 className="text-lg font-oswald text-amber-700 text-center">{title}</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center space-x-3">
              <div className={`h-2 w-2 rounded-full ${
                i === 0 ? "bg-amber-600 animate-pulse" :
                i === 1 ? "bg-amber-400" :
                "bg-amber-200"
              }`}/>
              <span className="text-sm text-amber-700">{step}</span>
            </div>
          ))}
        </div>
      </LoadingIndicator>
    </div>
  );
}
