
import { Card } from "@/components/ui/card";
import VideoRecorder from "@/components/video-analysis/VideoRecorder";
import { useState, useEffect } from "react";
import { cleanContentForTeleprompter } from "./utils/contentCleaning";
import { TikTokTeleprompterControls } from "./components/TikTokTeleprompterControls";
import { TikTokTeleprompterDisplay } from "./components/TikTokTeleprompterDisplay";

interface TikTokRecordingInterfaceProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
}

export function TikTokRecordingInterface({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition
}: TikTokRecordingInterfaceProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.1);
  const [fontSize, setFontSize] = useState(24);
  const [cleanedScript, setCleanedScript] = useState('');

  useEffect(() => {
    const cleaned = cleanContentForTeleprompter(workoutScript);
    setCleanedScript(cleaned);
  }, [workoutScript]);

  useEffect(() => {
    if (!isScrolling) return;

    const interval = setInterval(() => {
      const newPosition = teleprompterPosition + scrollSpeed;
      if (newPosition >= 100) {
        setIsScrolling(false);
        setTeleprompterPosition(100);
      } else {
        setTeleprompterPosition(newPosition);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isScrolling, scrollSpeed, teleprompterPosition, setTeleprompterPosition]);

  const handleToggleScroll = () => {
    setIsScrolling(!isScrolling);
  };

  const handleReset = () => {
    setIsScrolling(false);
    setTeleprompterPosition(0);
  };

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-3">
      {/* Video Recording Side */}
      <Card className="h-full min-h-[300px] lg:min-h-0 p-4 bg-background/50 border-border/50 rounded-2xl flex flex-col">
        <div className="flex-shrink-0 mb-3">
          <h3 className="text-base font-semibold text-foreground mb-2 text-center">📹 Record</h3>
        </div>
        <div className="flex-1 min-h-0">
          <VideoRecorder />
        </div>
      </Card>

      {/* Teleprompter Side */}
      <Card className="h-full min-h-[300px] lg:min-h-0 p-4 bg-background/50 border-border/50 rounded-2xl flex flex-col">
        <TikTokTeleprompterControls
          isScrolling={isScrolling}
          scrollSpeed={scrollSpeed}
          fontSize={fontSize}
          onToggleScroll={handleToggleScroll}
          onReset={handleReset}
          onScrollSpeedChange={setScrollSpeed}
          onFontSizeChange={setFontSize}
        />

        <TikTokTeleprompterDisplay
          cleanedScript={cleanedScript}
          fontSize={fontSize}
          teleprompterPosition={teleprompterPosition}
        />
      </Card>
    </div>
  );
}
