
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Minus, Plus } from "lucide-react";

interface TikTokTeleprompterControlsProps {
  isScrolling: boolean;
  scrollSpeed: number;
  fontSize: number;
  onToggleScroll: () => void;
  onReset: () => void;
  onScrollSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
}

export function TikTokTeleprompterControls({
  isScrolling,
  scrollSpeed,
  fontSize,
  onToggleScroll,
  onReset,
  onScrollSpeedChange,
  onFontSizeChange
}: TikTokTeleprompterControlsProps) {
  const increaseFontSize = () => {
    onFontSizeChange(Math.min(fontSize + 2, 40));
  };

  const decreaseFontSize = () => {
    onFontSizeChange(Math.max(fontSize - 2, 16));
  };

  return (
    <div className="flex-shrink-0 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">📜 Script</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isScrolling ? "destructive" : "default"}
            onClick={onToggleScroll}
            className="flex items-center gap-1 text-xs rounded-full h-8"
          >
            {isScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isScrolling ? "Pause" : "Start"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="flex items-center gap-1 text-xs rounded-full h-8"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* TikTok-style controls */}
      <div className="space-y-3">
        {/* Speed Control */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-2">
          <span className="text-xs text-foreground/70 w-12">Speed</span>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={scrollSpeed}
            onChange={(e) => onScrollSpeedChange(Number(e.target.value))}
            className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-foreground/70 w-8 text-right">{Math.round(scrollSpeed * 100)}%</span>
        </div>
        
        {/* Font Size Control */}
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-2">
          <span className="text-xs text-foreground/70 w-12">Size</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={decreaseFontSize}
            className="h-6 w-6 p-0 rounded-full"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-xs text-foreground/70 w-8 text-center">{fontSize}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={increaseFontSize}
            className="h-6 w-6 p-0 rounded-full"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
