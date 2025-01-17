import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, RefreshCw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutSectionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}

const WorkoutSection = ({ label, value, onChange, minHeight = "80px" }: WorkoutSectionProps) => (
  <div className="space-y-2 rounded bg-muted p-4 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <label className="text-sm font-bold uppercase tracking-tight text-primary">
      {label}
    </label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[80px] resize-y bg-white font-medium text-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [warmup, setWarmup] = useState("");
  const [wod, setWod] = useState("");
  const [notes, setNotes] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update local state when allWorkouts changes
  useEffect(() => {
    if (allWorkouts && allWorkouts[title]) {
      setWarmup(allWorkouts[title].warmup || "");
      setWod(allWorkouts[title].wod || "");
      setNotes(allWorkouts[title].notes || "");
    }
  }, [allWorkouts, title]);

  const handleSpeakWorkout = async () => {
    try {
      setIsSpeaking(true);
      const speechText = `
        Today is ${title}.
        Warm Up: ${warmup}.
        Workout Of the Day: ${wod}.
        ${notes ? `Notes: ${notes}.` : ''}
      `;

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: speechText }
      });

      if (error) throw error;

      if (data?.audioContent && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audioContent}`;
        await audioRef.current.play();
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
        };
      }
    } catch (error) {
      console.error("Error calling text-to-speech:", error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
      setIsSpeaking(false);
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
          modificationPrompt,
          allWorkouts,
        },
      });

      if (error) throw error;

      if (data) {
        setWarmup(data.warmup);
        setWod(data.wod);
        setNotes(data.notes);
        setModificationPrompt("");
        
        if (onUpdate) {
          onUpdate(data);
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
    <Card className="relative w-full animate-fade-in border-[4px] border-primary bg-muted shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <audio ref={audioRef} className="hidden" />
      <CardHeader className="relative border-b-[4px] border-primary bg-card">
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
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary">
              <CalendarDays className="h-4 w-4" />
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
        <div className="space-y-2">
          <Input
            placeholder={`How would you like to modify ${title}'s workout?`}
            value={modificationPrompt}
            onChange={(e) => setModificationPrompt(e.target.value)}
            className="border-2 border-primary bg-white text-foreground"
          />
          <Button 
            onClick={handleModifyWorkout}
            disabled={isModifying}
            className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isModifying ? 'animate-spin' : ''}`} />
            {isModifying ? 'Modifying...' : 'Modify Workout'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}