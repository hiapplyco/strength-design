import { CalendarDays, Share2 } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface HeaderActionsProps {
  onShare?: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function HeaderActions({
  onShare,
  onExport,
  isExporting,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onShare && <ActionButton icon={Share2} onClick={onShare} />}
      <ActionButton icon={CalendarDays} onClick={onExport} isLoading={isExporting} />
    </div>
  );
}