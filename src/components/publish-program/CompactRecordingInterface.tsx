
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import VideoRecorder from "@/components/video-analysis/VideoRecorder";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Type, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface CompactRecordingInterfaceProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
}

// Function to clean HTML content for teleprompter display
const cleanContentForTeleprompter = (content: string): string => {
  if (!content) return '';
  
  try {
    // First try to parse as JSON in case it's a structured response
    const parsed = JSON.parse(content);
    if (parsed.content) {
      content = parsed.content;
    }
  } catch {
    // If not JSON, proceed with the original content
  }
  
  // Create a temporary div to strip HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Get plain text content
  let cleanText = tempDiv.textContent || tempDiv.innerText || content;
  
  // Remove CSS styles completely
  cleanText = cleanText.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleanText = cleanText.replace(/body\s*\{[^}]*\}/gi, '');
  cleanText = cleanText.replace(/ul\s*\{[^}]*\}/gi, '');
  cleanText = cleanText.replace(/[a-zA-Z-]+\s*:\s*[^;]+;/g, '');
  
  // Remove common markdown and HTML patterns
  cleanText = cleanText
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/<!DOCTYPE.*?>/gi, '') // Remove DOCTYPE
    .replace(/<html.*?>|<\/html>/gi, '') // Remove html tags
    .replace(/<head.*?>[\s\S]*?<\/head>/gi, '') // Remove head section
    .replace(/<body.*?>|<\/body>/gi, '') // Remove body tags
    .replace(/<script.*?>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style.*?>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/font-family:\s*[^;]+;?/gi, '') // Remove font-family declarations
    .replace(/list-style-type:\s*[^;]+;?/gi, '') // Remove list-style declarations
    .replace(/margin-left:\s*[^;]+;?/gi, '') // Remove margin declarations
    
  // Clean up day sections and add proper formatting
  cleanText = cleanText
    .replace(/Day\s+(\d+)/gi, '\n\nDay $1\n') // Add line breaks around days
    .replace(/🎯\s*Focus/gi, '\n\nFocus:') // Format focus sections
    .replace(/🏃‍♂️\s*Warmup/gi, '\n\nWarmup:') // Format warmup sections
    .replace(/🏋️‍♂️\s*Workout/gi, '\n\nWorkout:') // Format workout sections
    .replace(/💪\s*Strength/gi, '\n\nStrength Focus:') // Format strength sections
    .replace(/📝\s*Notes/gi, '\n\nNotes:') // Format notes sections
    
  // Add line breaks for better readability
  cleanText = cleanText
    .replace(/(\d+)\s+minutes/g, '$1 minutes\n') // Break after time durations
    .replace(/(\d+)\s+sets/g, '\n$1 sets') // Break before sets
    .replace(/(\d+)\s+reps/g, '$1 reps\n') // Break after reps
    .replace(/Cool-down:/g, '\nCool-down:') // Break before cool-down
    .replace(/Adjust/g, '\nAdjust') // Break before adjustment notes
    .replace(/Focus\s+on/g, '\nFocus on') // Break before focus instructions
    
  // Clean up excessive whitespace but preserve intentional breaks
  cleanText = cleanText
    .replace(/\n{4,}/g, '\n\n\n') // Limit to max 3 consecutive newlines
    .replace(/\s{3,}/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .trim();
  
  // Split into paragraphs and ensure proper spacing
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return paragraphs.map(paragraph => {
    // Clean up each paragraph
    return paragraph
      .replace(/\s+/g, ' ')
      .trim();
  }).join('\n\n');
};

export function CompactRecordingInterface({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition
}: CompactRecordingInterfaceProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.1);
  const [fontSize, setFontSize] = useState(24);
  const [cleanedScript, setCleanedScript] = useState('');

  // Clean the script whenever it changes
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

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 40));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 16));
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Video Recording Side */}
      <Card className="h-full p-3 bg-background/50 border-primary/50 flex flex-col">
        <div className="flex-shrink-0 mb-3">
          <h3 className="text-base font-semibold text-foreground mb-2">Video Recording</h3>
        </div>
        <div className="flex-1 min-h-0">
          <VideoRecorder />
        </div>
      </Card>

      {/* Teleprompter Side */}
      <Card className="h-full p-3 bg-background/50 border-primary/50 flex flex-col">
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Teleprompter</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleScroll}
                className="flex items-center gap-1 text-xs"
              >
                {isScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isScrolling ? "Pause" : "Start"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </div>
          
          {/* Controls Row */}
          <div className="mt-2 space-y-2">
            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/70">Speed:</span>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-foreground/70 w-12">{Math.round(scrollSpeed * 100)}%</span>
            </div>
            
            {/* Font Size Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/70">Text:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={decreaseFontSize}
                className="h-6 w-6 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-xs text-foreground/70 w-8 text-center">{fontSize}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={increaseFontSize}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Teleprompter Content */}
        <div className="flex-1 min-h-0 mt-3 bg-black rounded-lg overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div 
                className="text-white leading-relaxed"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                  transform: `translateY(-${teleprompterPosition}%)`,
                  transition: 'transform 0.1s linear'
                }}
              >
                {cleanedScript ? (
                  cleanedScript.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-8">
                      {paragraph || '\u00A0'}
                    </p>
                  ))
                ) : (
                  <p className="text-white/50 italic">
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
