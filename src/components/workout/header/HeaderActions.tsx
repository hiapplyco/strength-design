import { Share2, Volume2, CalendarDays, Edit } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface HeaderActionsProps {
  onShare: () => void;
  onSpeak: () => void;
  onExport: () => void;
  onModify?: () => void;
  isSpeaking: boolean;
  isExporting: boolean;
  isModifying?: boolean;
  showModify?: boolean;
}

export function HeaderActions({
  onShare,
  onSpeak,
  onExport,
  onModify,
  isSpeaking,
  isExporting,
  isModifying,
  showModify
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ActionButton icon={Share2} onClick={onShare} />
      <ActionButton icon={Volume2} onClick={onSpeak} isLoading={isSpeaking} />
      <ActionButton icon={CalendarDays} onClick={onExport} isLoading={isExporting} />
      {showModify && (
        <ActionButton icon={Edit} onClick={onModify!} isLoading={isModifying} />
      )}
    </div>
  );
}