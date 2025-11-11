
import { DocumentPublishing } from "@/components/ui/loading-states/DocumentPublishing";
import { cn } from "@/lib/utils";

interface DocumentPublishingLoadingProps {
  className?: string;
  fullScreen?: boolean;
}

export function DocumentPublishingLoading({ 
  className,
  fullScreen = true 
}: DocumentPublishingLoadingProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen bg-background",
        className
      )}
    >
      <DocumentPublishing />
    </div>
  );
}
