
import { VoiceGenerating } from "@/components/ui/loading-states/VoiceGenerating";
import { cn } from "@/lib/utils";

interface VoiceGeneratingLoadingProps {
  className?: string;
  fullScreen?: boolean;
}

export function VoiceGeneratingLoading({ 
  className,
  fullScreen = false 
}: VoiceGeneratingLoadingProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen bg-background",
        className
      )}
    >
      <VoiceGenerating />
    </div>
  );
}
