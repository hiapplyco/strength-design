import { Share2, FileSpreadsheet, Copy } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { useToast } from "@/hooks/use-toast";
import { ExportButton } from "./ExportButton";
import { DownloadButton } from "./DownloadButton";
import { formatAllWorkouts } from "@/utils/workout-formatting";
import { downloadWorkout } from "@/utils/workout-export";

interface HeaderActionsProps {
  onShare?: () => void;
  onExport: () => void;
  isExporting: boolean;
  workoutText: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
}

export function HeaderActions({
  onShare,
  onExport,
  isExporting,
  workoutText,
  allWorkouts,
}: HeaderActionsProps) {
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Workout copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy workout",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (format: 'txt' | 'pdf' | 'csv') => {
    const content = allWorkouts ? formatAllWorkouts(allWorkouts) : workoutText;
    await downloadWorkout(format, content);
  };

  return (
    <div className="flex items-center gap-2 relative z-10 mr-2">
      {onShare && <ActionButton icon={Share2} onClick={onShare} />}
      <ExportButton onExport={onExport} isExporting={isExporting} />
      <DownloadButton onDownload={handleDownload} />
      <ActionButton 
        icon={Copy} 
        onClick={() => handleCopy(workoutText)}
      />
    </div>
  );
}