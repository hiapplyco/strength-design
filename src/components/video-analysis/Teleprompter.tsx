import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface TeleprompterProps {
  script: string;
  onPositionChange?: (position: number) => void;
}

export const Teleprompter = ({ script, onPositionChange }: TeleprompterProps) => {
  const { toast } = useToast();
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [mirrorV, setMirrorV] = useState(false);
  const [mirrorH, setMirrorH] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timerRef = useRef<number>();
  const lastScrollPosition = useRef(0);
  const recognitionRef = useRef<any>(null);

  // Reset scroll position if the script changes
  useEffect(() => {
    lastScrollPosition.current = 0;
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [script]);

  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript.toLowerCase();
          
          // Find the position of the spoken text in the script
          const scriptLower = script.toLowerCase();
          const words = transcript.split(' ');
          
          // Look for the last few words to find the current position
          for (let i = words.length; i > 0; i--) {
            const phrase = words.slice(i - 3, i).join(' ');
            const position = scriptLower.indexOf(phrase);
            
            if (position !== -1 && scrollRef.current) {
              // Calculate scroll position based on the found text position
              const textHeight = scrollRef.current.scrollHeight;
              const viewportHeight = scrollRef.current.clientHeight;
              const scrollPosition = (position / script.length) * textHeight;
              
              // Smooth scroll to the position
              scrollRef.current.scrollTo({
                top: Math.max(0, scrollPosition - viewportHeight / 3),
                behavior: 'smooth'
              });
              
              if (onPositionChange) {
                onPositionChange(scrollPosition);
              }
              break;
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please enable microphone access to use speech recognition.",
              variant: "destructive",
            });
            setSpeechEnabled(false);
          }
        };

        setSpeechEnabled(true);
      } else {
        toast({
          title: "Speech Recognition Unavailable",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      toast({
        title: "Speech Recognition Error",
        description: "Failed to initialize speech recognition.",
        variant: "destructive",
      });
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }
    
    if (speechEnabled) {
      if (recognitionRef.current?.state === 'active') {
        recognitionRef.current.stop();
        toast({
          title: "Speech Recognition Stopped",
          description: "Auto-scroll based on speech is now disabled.",
        });
      } else {
        recognitionRef.current.start();
        toast({
          title: "Speech Recognition Started",
          description: "Auto-scroll will follow your speech.",
        });
      }
    }
  };

  // Handle scrolling animation
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

  // Handle timer
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

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const togglePlay = () => setPlaying(prev => !prev);
  
  const handleReset = () => {
    setPlaying(false);
    setElapsedTime(0);
    if (scrollRef.current) {
      lastScrollPosition.current = 0;
      scrollRef.current.scrollTo(0, 0);
    }
    if (recognitionRef.current?.state === 'active') {
      recognitionRef.current.stop();
    }
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
          <label className="text-white whitespace-nowrap">Speed: {speed.toFixed(1)}x</label>
          <Slider
            value={[speed]}
            onValueChange={([value]) => setSpeed(value)}
            min={0.5}
            max={5}
            step={0.5}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-white whitespace-nowrap">Font size: {fontSize}px</label>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={14}
            max={32}
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
          onClick={toggleSpeechRecognition}
          variant={speechEnabled ? "default" : "secondary"}
        >
          Voice Control: {speechEnabled ? 'ON' : 'OFF'}
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
            lineHeight: 1.4,
            transform: `scale(${mirrorH ? -1 : 1}, ${mirrorV ? -1 : 1})` 
          }}
        >
          {script}
        </div>
      </div>
    </div>
  );
};