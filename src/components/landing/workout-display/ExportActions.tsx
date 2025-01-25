import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadWorkout } from "@/utils/workout-export";

interface ExportActionsProps {
  onExportCalendar: () => Promise<void>;
  onCopy: () => Promise<void>;
  isExporting: boolean;
  workoutText: string;
}

export const ExportActions = ({
  onExportCalendar,
  onCopy,
  isExporting,
  workoutText
}: ExportActionsProps) => {
  const handleExport = async (format: 'txt' | 'pdf' | 'csv') => {
    await downloadWorkout(format, workoutText);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={onExportCalendar}
        disabled={isExporting}
      >
        <CalendarDays className="w-4 h-4" />
        Calendar
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExport('txt')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as TXT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={onCopy}
      >
        <FileText className="w-4 h-4" />
        Copy
      </Button>
    </div>
  );
};