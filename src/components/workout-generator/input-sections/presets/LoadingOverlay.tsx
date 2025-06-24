
import { WorkoutGenerating } from "@/components/ui/loading-states";
import { cn } from "@/lib/utils";
import { zIndex, radius, shadows, spacing } from "@/lib/design-tokens";

interface LoadingOverlayProps {
  className?: string;
  message?: string;
}

export function LoadingOverlay({ className, message }: LoadingOverlayProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center",
        zIndex.modal,
        className
      )}
    >
      <div 
        className={cn(
          "bg-background border border-border",
          spacing.component.xl,
          radius["2xl"],
          shadows["2xl"]
        )}
      >
        <WorkoutGenerating />
        {message && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
