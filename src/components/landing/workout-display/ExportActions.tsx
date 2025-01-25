import { Button } from "@/components/ui/button";
import { CalendarDays, FileSpreadsheet, Copy, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadWorkout } from "@/utils/workout-export";

interface ExportActionsProps {
  onExportCalendar: () => Promise<void>;
  onExportDocs: () => void;
  onExportExcel: () => void;
  onCopy: () => Promise<void>;
  isExporting: boolean;
  workoutText: string;
}

export const ExportActions = ({
  onExportCalendar,
  onExportExcel,
  onCopy,
  isExporting,
  workoutText
}: ExportActionsProps) => {
  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
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
            <FileText className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExport('txt')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as TXT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('docx')}>
            <FileText className="w-4 h-4 mr-2" />
            Export as DOCX
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
        onClick={onExportExcel}
      >
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={onCopy}
      >
        <Copy className="w-4 h-4" />
        Copy
      </Button>
    </div>
  );
};