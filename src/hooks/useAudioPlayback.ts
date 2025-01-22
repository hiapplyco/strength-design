import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useAudioPlayback() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleSpeakWorkout = async (title: string, allWorkouts: any, warmup: string, wod: string, notes: string) => {
    try {
      if (isPaused && audioRef.current) {
        audioRef.current.play();
        setIsPaused(false);
        setIsSpeaking(true);
        return;
      }

      setIsSpeaking(true);
      setIsPaused(false);

      const { data: monologueData, error: monologueError } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          dayToSpeak: title,
          workoutPlan: {
            [title]: allWorkouts[title]
          },
          warmup,
          wod: `Important: When referring to this section, always say "workout of the day" instead of "WOD". Here's the workout: ${wod}`,
          notes
        }
      });

      if (monologueError) throw monologueError;

      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: monologueData.monologue }
      });

      if (speechError) throw speechError;

      if (speechData?.audioContent && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${speechData.audioContent}`;
        await audioRef.current.play();
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
      }
    } catch (error) {
      console.error("Error in handleSpeakWorkout:", error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  return {
    isSpeaking,
    isPaused,
    audioRef,
    handleSpeakWorkout,
    handlePause
  };
}