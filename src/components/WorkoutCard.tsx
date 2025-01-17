import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, RefreshCw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createEvents } from 'ics';
import { sanitizeText } from "@/utils/text";

interface WorkoutSectionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  isDescription?: boolean;
}

const WorkoutSection = ({ label, value, onChange, minHeight = "80px", isDescription = false }: WorkoutSectionProps) => (
  <div className={`space-y-2 rounded-[20px] ${isDescription ? 'bg-primary' : 'bg-muted'} p-4 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
    <label className={`text-sm font-bold uppercase tracking-tight ${isDescription ? 'text-white' : 'text-primary'}`}>
      {label}
    </label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${isDescription ? 'min-h-[60px] text-lg font-collegiate uppercase tracking-wide' : 'min-h-[80px]'} resize-y bg-white font-medium text-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-[20px]`}
      style={{ minHeight }}
    />
  </div>
);

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

  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      setWarmup(sanitizeText(allWorkouts[title].warmup || ""));
      setWod(sanitizeText(allWorkouts[title].wod || ""));
      setNotes(sanitizeText(allWorkouts[title].notes || ""));
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
      <CardHeader className="relative border-b-[4px] border-primary bg-card rounded-t-[20px]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-collegiate uppercase tracking-tight text-primary">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">{duration}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-primary"
              onClick={handleSpeakWorkout}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-primary"
              onClick={handleExportCalendar}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
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
        <div className="space-y-2 border-4 border-destructive rounded-[20px] p-4">
          <Input
            placeholder={`Examples: "Make ${title}'s workout easier", "Add more cardio", "Focus on strength", "Modify for knee injury"`}
            value={modificationPrompt}
            onChange={(e) => setModificationPrompt(e.target.value)}
            className="border-2 border-primary bg-white text-foreground placeholder:text-gray-400 rounded-[20px]"
          />
          <Button 
            onClick={handleModifyWorkout}
            disabled={isModifying}
            className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50 rounded-[20px]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isModifying ? 'animate-spin' : ''}`} />
            {isModifying ? 'Modifying...' : 'Modify Workout'}
          </Button>
        </div>
      </CardContent>
      
    </Card>
  );
}
