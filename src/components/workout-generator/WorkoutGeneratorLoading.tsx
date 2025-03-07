
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export function WorkoutGeneratorLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingIndicator>
        <span className="text-white/80">Loading workout generator...</span>
      </LoadingIndicator>
    </div>
  );
}
