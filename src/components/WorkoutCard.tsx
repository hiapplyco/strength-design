import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createEvents } from 'ics';
import { sanitizeText } from "@/utils/text";
import { WorkoutSection } from "./workout/WorkoutSection";
import { WorkoutHeader } from "./workout/WorkoutHeader";
import { WorkoutModifier } from "./workout/WorkoutModifier";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  allWorkouts?: Record<string, { warmup: string; wod: string; notes: string; }>;
  onUpdate?: (updates: { warmup: string; wod: string; notes: string; }) => void;
}

export function WorkoutCard({ title, description, duration, allWorkouts, onUpdate }: WorkoutCardProps) {
  const { toast } = useToast();
  const [isModifying, setIsModifying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [warmup, setWarmup] = useState("");
  const [wod, setWod] = useState("");
  const [notes, setNotes] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize state with workout details when they become available
  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      const workout = allWorkouts[title];
      setWarmup(workout.warmup || "");
      setWod(workout.wod || "");
      setNotes(workout.notes || "");
    }
  }, [allWorkouts, title]);

  const handleSpeakWorkout = async () => {
    try {
      setIsSpeaking(true);

      const { data: monologueData, error: monologueError } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          dayToSpeak: title,
          workoutPlan: allWorkouts,
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

  const handleExportCalendar = async () => {
    try {
      setIsExporting(true);
      
      const eventContent = `Warmup:\n${sanitizeText(warmup)}\n\nWOD:\n${sanitizeText(wod)}\n\nNotes:\n${sanitizeText(notes)}`;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      
      const event = {
        start: [
          tomorrow.getFullYear(),
          tomorrow.getMonth() + 1,
          tomorrow.getDate(),
          tomorrow.getHours(),
          tomorrow.getMinutes()
        ] as [number, number, number, number, number],
        duration: { hours: 1 },
        title: `${sanitizeText(title)} Workout`,
        description: eventContent,
        location: '',
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const
      };

      createEvents([event], (error: Error | undefined, value: string) => {
        if (error) {
          console.error(error);
          toast({
            title: "Error",
            description: "Failed to create calendar event",
            variant: "destructive",
          });
          return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${title.toLowerCase()}-workout.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Success",
          description: "Calendar event has been downloaded",
        });
      });
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast({
        title: "Error",
        description: "Failed to export calendar event",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleModifyWorkout = async () => {
    if (!modificationPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter how you'd like to modify the workout",
        variant: "destructive",
      });
      return;
    }

    setIsModifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('workout-modifier', {
        body: {
          dayToModify: title,
          modificationPrompt: sanitizeText(modificationPrompt),
          allWorkouts,
        },
      });

      if (error) throw error;

      if (data) {
        setWarmup(sanitizeText(data.warmup));
        setWod(sanitizeText(data.wod));
        setNotes(sanitizeText(data.notes));
        setModificationPrompt("");
        
        if (onUpdate) {
          onUpdate({
            warmup: sanitizeText(data.warmup),
            wod: sanitizeText(data.wod),
            notes: sanitizeText(data.notes)
          });
        }

        toast({
          title: "Success",
          description: `${title}'s workout has been modified`,
        });
      }
    } catch (error) {
      console.error('Error modifying workout:', error);
      toast({
        title: "Error",
        description: "Failed to modify workout",
        variant: "destructive",
      });
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <Card className="relative w-full animate-fade-in border-[4px] border-primary bg-muted shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[20px]">
      <audio ref={audioRef} className="hidden" />
      
      <WorkoutHeader
        title={title}
        duration={duration}
        isSpeaking={isSpeaking}
        isExporting={isExporting}
        onSpeak={handleSpeakWorkout}
        onExport={handleExportCalendar}
      />
      
      <CardContent className="space-y-4 p-6">
        <WorkoutSection
          label="Description"
          value={description}
          onChange={() => {}}
          minHeight="60px"
          isDescription={true}
        />
        <WorkoutSection
          label="Warmup"
          value={warmup}
          onChange={setWarmup}
          minHeight="80px"
        />
        <WorkoutSection
          label="WOD"
          value={wod}
          onChange={setWod}
          minHeight="100px"
        />
        <WorkoutSection
          label="Notes"
          value={notes}
          onChange={setNotes}
          minHeight="60px"
        />
        
        <WorkoutModifier
          title={title}
          modificationPrompt={modificationPrompt}
          isModifying={isModifying}
          onModificationPromptChange={setModificationPrompt}
          onModify={handleModifyWorkout}
        />
      </CardContent>
    </Card>
  );
}