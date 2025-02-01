import React, { useState, useRef, useEffect } from 'react';

interface TeleprompterProps {
  script: string;
  onPositionChange?: (position: number) => void;
}

export const Teleprompter = ({ script, onPositionChange }: TeleprompterProps) => {
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastScrollPosition = useRef(0);

  useEffect(() => {
    if (playing && scrollRef.current) {
      const scroll = () => {
        if (!scrollRef.current) return;
        
        lastScrollPosition.current += speed;
        scrollRef.current.scrollTo(0, lastScrollPosition.current);
        
        if (onPositionChange) {
          onPositionChange(lastScrollPosition.current);
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
  }, [playing, speed, onPositionChange]);

  const togglePlay = () => setPlaying(!playing);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-white">Speed: {speed.toFixed(1)}x</label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-1/2"
        />
        
        <label className="text-white">Font size: {fontSize}px</label>
        <input
          type="range"
          min="14"
          max="32"
          step="1"
          value={fontSize}
          onChange={(e) => setFontSize(parseFloat(e.target.value))}
          className="w-1/2"
        />
      </div>

      <button 
        onClick={togglePlay}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      
      <div 
        ref={scrollRef}
        className="mt-4 p-4 bg-black/50 rounded-lg overflow-y-auto h-[400px] whitespace-pre-wrap text-center"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
      >
        {script}
      </div>
    </div>
  );
};