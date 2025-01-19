import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useAudioPlayback() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleSpeakWorkout = async (title: string, allWorkouts: any, warmup: string, wod: string, notes: string) => {
    try {
      setIsSpeaking(true);

      const { data: monologueData, error: monologueError } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          dayToSpeak: title,
          workoutPlan: {
            [title]: allWorkouts[title] // Only pass the current day's workout
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
    }
  };

  return {
    isSpeaking,
    audioRef,
    handleSpeakWorkout
  };
}