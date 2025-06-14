
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import VideoRecorder from "@/components/video-analysis/VideoRecorder";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

interface CompactRecordingInterfaceProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
}

export function CompactRecordingInterface({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition
}: CompactRecordingInterfaceProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  useEffect(() => {
    if (!isScrolling) return;

    const interval = setInterval(() => {
      setTeleprompterPosition((prev: number) => {
        const newPosition = prev + scrollSpeed;
        if (newPosition >= 100) {
          setIsScrolling(false);
          return 100;
        }
        return newPosition;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isScrolling, scrollSpeed, setTeleprompterPosition]);

  const handleToggleScroll = () => {
    setIsScrolling(!isScrolling);
  };

  const handleReset = () => {
    setIsScrolling(false);
    setTeleprompterPosition(0);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Video Recording Side */}
      <Card className="h-full p-4 bg-background/50 border-primary/50 flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">Video Recording</h3>
        </div>
        <div className="flex-1 min-h-0">
          <VideoRecorder />
        </div>
      </Card>

      {/* Teleprompter Side */}
      <Card className="h-full p-4 bg-background/50 border-primary/50 flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Teleprompter</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleScroll}
                className="flex items-center gap-2"
              >
                {isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isScrolling ? "Pause" : "Start"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-foreground/70">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-foreground/70 w-8">{scrollSpeed}x</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full">
            <div className="pr-4">
              <div 
                className="text-lg leading-relaxed text-foreground"
                style={{
                  transform: `translateY(-${teleprompterPosition}%)`,
                  transition: 'transform 0.1s linear'
                }}
              >
                {workoutScript ? (
                  workoutScript.split('\n').map((line, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {line || '\u00A0'}
                    </p>
                  ))
                ) : (
                  <p className="text-foreground/50 italic">
                    Generate a script to see it here for recording...
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
