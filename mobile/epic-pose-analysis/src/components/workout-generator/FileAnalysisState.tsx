
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { spacing, typography, radius, shadows } from "@/lib/design-tokens";

interface FileAnalysisStateProps {
  title: string;
  steps: string[];
}

export function FileAnalysisState({ title, steps }: FileAnalysisStateProps) {
  return (
    <Badge 
      variant="secondary"
      className={cn(
        "bg-warning/10 text-warning border-warning/20",
        spacing.component.sm,
        radius.md,
        shadows.sm,
        "backdrop-blur-sm flex items-center gap-2"
      )}
    >
      <LoadingIndicator size="small" variant="default" className="text-warning">
        <span className={cn(typography.caption, "font-medium")}>{title}</span>
      </LoadingIndicator>
    </Badge>
  );
}
