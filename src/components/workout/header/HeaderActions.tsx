import { Play, Pause, CalendarDays, Edit, Share2 } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface HeaderActionsProps {
  onShare?: () => void;
  onSpeak: () => void;
  onExport: () => void;
  onModify?: () => void;
  isSpeaking: boolean;
  isPaused?: boolean;
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
  isPaused,
  isExporting,
  isModifying,
  showModify
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onShare && <ActionButton icon={Share2} onClick={onShare} />}
      <ActionButton 
        icon={isSpeaking ? Pause : Play} 
        onClick={onSpeak} 
        isLoading={false}
      />
      <ActionButton icon={CalendarDays} onClick={onExport} isLoading={isExporting} />
      {showModify && (
        <ActionButton icon={Edit} onClick={onModify!} isLoading={isModifying} />
      )}
    </div>
  );
}