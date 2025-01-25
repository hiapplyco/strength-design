import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface FileAnalysisStateProps {
  title: string;
  steps: string[];
}

export function FileAnalysisState({ title, steps }: FileAnalysisStateProps) {
  return (
    <div className="bg-white/20 backdrop-blur-sm p-8 rounded-lg shadow-xl">
      <LoadingIndicator className="py-4">
        <h3 className="text-2xl font-oswald text-amber-700 text-center">{title}</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center space-x-3">
              <div className={`h-2 w-2 rounded-full ${
                i === 0 ? "bg-amber-600 animate-pulse" :
                i === 1 ? "bg-amber-400" :
                "bg-amber-200"
              }`}/>
              <span className="text-amber-700">{step}</span>
            </div>
          ))}
        </div>
      </LoadingIndicator>
    </div>
  );
}