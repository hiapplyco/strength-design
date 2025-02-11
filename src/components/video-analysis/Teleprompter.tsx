import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface TeleprompterProps {
  script: string;
  position: number;
  setPosition: (position: number) => void;
}

interface WordSpan {
  word: string;
  isSpoken: boolean;
}

export const Teleprompter = ({ script, position, setPosition }: TeleprompterProps) => {
  const { toast } = useToast();
  const [speed, setSpeed] = useState(0.25); // Start with slower default speed
  const [playing, setPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(32);
  const [mirrorV, setMirrorV] = useState(false);
  const [mirrorH, setMirrorH] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [words, setWords] = useState<WordSpan[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timerRef = useRef<number>();
  const lastScrollPosition = useRef(0);

  // Initialize words from script
  useEffect(() => {
    const wordArray = script.split(/\s+/).map(word => ({
      word,
      isSpoken: false
    }));
    setWords(wordArray);
    lastScrollPosition.current = 0;
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [script]);

  useEffect(() => {
    if (playing && scrollRef.current) {
      const scroll = () => {
        if (!scrollRef.current) return;
        lastScrollPosition.current += speed;
        scrollRef.current.scrollTo(0, lastScrollPosition.current);
        
        if (setPosition) {
          setPosition(lastScrollPosition.current);
        }
        animationRef.current = requestAnimationFrame(scroll);
      };

      animationRef.current = requestAnimationFrame(scroll);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, setPosition]);

  useEffect(() => {
    if (showTimer && playing) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showTimer, playing]);

  const togglePlay = () => setPlaying(prev => !prev);
  
  const handleReset = () => {
    setPlaying(false);
    setElapsedTime(0);
    if (scrollRef.current) {
      lastScrollPosition.current = 0;
      scrollRef.current.scrollTo(0, 0);
    }
    setWords(prevWords => prevWords.map(word => ({ ...word, isSpoken: false })));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-white whitespace-nowrap">Speed: {speed.toFixed(2)}x</label>
          <Slider
            value={[speed]}
            onValueChange={([value]) => setSpeed(value)}
            min={0.1}
            max={5}
            step={0.1}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-white whitespace-nowrap">Font size: {fontSize}px</label>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={14}
            max={72}
            step={1}
            className="w-40"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={togglePlay}
          variant="default"
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button 
          onClick={handleReset}
          variant="secondary"
        >
          Reset
        </Button>
        <Button 
          onClick={() => setMirrorV(prev => !prev)}
          variant={mirrorV ? "default" : "secondary"}
        >
          Flip Vertical
        </Button>
        <Button 
          onClick={() => setMirrorH(prev => !prev)}
          variant={mirrorH ? "default" : "secondary"}
        >
          Flip Horizontal
        </Button>
        <Button 
          onClick={() => setShowTimer(prev => !prev)}
          variant={showTimer ? "default" : "secondary"}
        >
          Timer: {showTimer ? 'ON' : 'OFF'}
        </Button>
        {showTimer && (
          <div className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md">
            {formatTime(elapsedTime)}
          </div>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="mt-4 p-4 bg-black/50 rounded-lg overflow-y-auto h-[400px] relative"
      >
        <div 
          className="whitespace-pre-wrap text-center"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.6,
            transform: `scale(${mirrorH ? -1 : 1}, ${mirrorV ? -1 : 1})` 
          }}
        >
          {words.map((wordObj, index) => (
            <span
              key={index}
              className={`word ${wordObj.isSpoken ? 'text-blue-500' : 'text-white'} transition-colors duration-200`}
            >
              {wordObj.word}{' '}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
