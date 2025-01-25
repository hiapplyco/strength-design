import { CalendarDays, Share2, FileSpreadsheet, FileText, Copy } from "lucide-react";
import { ActionButton } from "./ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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

  const exportToGoogleDocs = (content: string) => {
    const docContent = encodeURIComponent(content);
    const googleDocsUrl = `https://docs.google.com/document/create?body=${docContent}`;
    window.open(googleDocsUrl, '_blank');
  };

  const exportToExcel = (content: string) => {
    const csvContent = content.split('\n').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workout.csv';
    link.click();
  };

  const formatAllWorkouts = () => {
    if (!allWorkouts) return '';
    return Object.entries(allWorkouts)
      .map(([day, workout]) => {
        const sections = [
          `Day: ${day}`,
          workout.strength && `Strength:\n${workout.strength}`,
          workout.warmup && `Warmup:\n${workout.warmup}`,
          workout.workout && `Workout:\n${workout.workout}`,
          workout.notes && `Notes:\n${workout.notes}`
        ].filter(Boolean);
        return sections.join('\n\n');
      })
      .join('\n\n---\n\n');
  };

  return (
    <div className="flex items-center gap-2">
      {onShare && <ActionButton icon={Share2} onClick={onShare} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <ActionButton 
              icon={CalendarDays} 
              onClick={() => {}}
              disabled={isExporting} 
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Single Day Export Options */}
          <DropdownMenuItem onClick={onExport} disabled={isExporting}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Add Day to Calendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportToGoogleDocs(workoutText)}>
            <FileText className="mr-2 h-4 w-4" />
            Export Day to Google Docs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportToExcel(workoutText)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Day to Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopy(workoutText)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Day to Clipboard
          </DropdownMenuItem>

          {allWorkouts && (
            <>
              <DropdownMenuSeparator />
              {/* Weekly Export Options */}
              <DropdownMenuItem onClick={() => exportToGoogleDocs(formatAllWorkouts())}>
                <FileText className="mr-2 h-4 w-4" />
                Export Week to Google Docs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(formatAllWorkouts())}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Week to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(formatAllWorkouts())}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Week to Clipboard
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}