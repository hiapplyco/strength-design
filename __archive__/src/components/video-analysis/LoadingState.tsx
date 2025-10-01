
import { LoadingIndicator } from "@/components/ui/loading-indicator";

export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center px-4">
          <LoadingIndicator className="scale-150">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 break-words">Creating Your Script</h2>
            <p className="text-foreground/70 text-sm sm:text-base break-words">We're crafting an engaging script for your workout video...</p>
          </LoadingIndicator>
        </div>
      </div>
    </div>
  );
};
