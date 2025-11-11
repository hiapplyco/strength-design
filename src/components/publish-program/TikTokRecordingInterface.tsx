
import { Card } from "@/components/ui/card";
// TODO: Restore VideoRecorder from archive if needed
// import VideoRecorder from "@/components/video-analysis/VideoRecorder";
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
    <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-2 gap-2 sm:gap-3 overflow-hidden">
      {/* Video Recording Side */}
      <Card className="h-full min-h-[250px] xl:min-h-0 p-2 sm:p-4 bg-background/50 border-border/50 rounded-xl sm:rounded-2xl flex flex-col w-full overflow-hidden">
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2 text-center">📹 Record</h3>
        </div>
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {/* TODO: Restore VideoRecorder */}
          {/* <VideoRecorder /> */}
          <div className="text-muted-foreground text-sm text-center p-8">Video recorder temporarily disabled</div>
        </div>
      </Card>

      {/* Teleprompter Side */}
      <Card className="h-full min-h-[250px] xl:min-h-0 p-2 sm:p-4 bg-background/50 border-border/50 rounded-xl sm:rounded-2xl flex flex-col w-full overflow-hidden">
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
