import { Button } from "@/components/ui/button";
import { CalendarDays, FileSpreadsheet, FileText, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportActionsProps {
  onExportCalendar: () => Promise<void>;
  onExportDocs: () => void;
  onExportExcel: () => void;
  onCopy: () => Promise<void>;
  isExporting: boolean;
}

export const ExportActions = ({
  onExportCalendar,
  onExportDocs,
  onExportExcel,
  onCopy,
  isExporting
}: ExportActionsProps) => {
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
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={onExportDocs}
      >
        <FileText className="w-4 h-4" />
        Docs
      </Button>
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