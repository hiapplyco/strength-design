import { CalendarDays, Share2, FileSpreadsheet, FileText, Copy } from "lucide-react";
import { ActionButton } from "./ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface HeaderActionsProps {
  onShare?: () => void;
  onExport: () => void;
  isExporting: boolean;
  workoutText: string;
}

export function HeaderActions({
  onShare,
  onExport,
  isExporting,
  workoutText,
}: HeaderActionsProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workoutText);
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

  const exportToGoogleDocs = () => {
    const docContent = encodeURIComponent(workoutText);
    const googleDocsUrl = `https://docs.google.com/document/create?body=${docContent}`;
    window.open(googleDocsUrl, '_blank');
  };

  const exportToExcel = () => {
    const csvContent = workoutText.split('\n').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workout.csv';
    link.click();
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onExport} disabled={isExporting}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Add to Calendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToGoogleDocs}>
            <FileText className="mr-2 h-4 w-4" />
            Export to Google Docs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}