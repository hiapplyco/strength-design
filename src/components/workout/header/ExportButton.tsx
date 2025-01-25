import { ActionButton } from "./ActionButton";
import { CalendarDays } from "lucide-react";

interface ExportButtonProps {
  onExport: () => void;
  isExporting: boolean;
}

export function ExportButton({ onExport, isExporting }: ExportButtonProps) {
  return (
    <ActionButton 
      icon={CalendarDays} 
      onClick={onExport}
      disabled={isExporting} 
    />
  );
}