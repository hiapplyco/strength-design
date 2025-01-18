import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { WorkoutSection } from "./workout/WorkoutSection";
import { WorkoutHeader } from "./workout/WorkoutHeader";
import { WorkoutModifier } from "./workout/WorkoutModifier";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useWorkoutState } from "@/hooks/useWorkoutState";
import { exportToCalendar } from "@/utils/calendar";
import { modifyWorkout } from "@/utils/workout";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  allWorkouts?: Record<string, { warmup: string; wod: string; notes: string; strength: string; }>;
  onUpdate?: (updates: { warmup: string; wod: string; notes: string; strength: string; }) => void;
}

export function WorkoutCard({ title, description, duration, allWorkouts, onUpdate }: WorkoutCardProps) {
  const { toast } = useToast();
  const [isModifying, setIsModifying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");
  
  const { isSpeaking, audioRef, handleSpeakWorkout } = useAudioPlayback();
  const { warmup, wod, notes, strength, setWarmup, setWod, setNotes, setStrength, setState } = useWorkoutState(title, allWorkouts);

  const formatWorkoutText = () => {
    const sections = [
      strength && `Strength:\n${strength}`,
      warmup && `Warmup:\n${warmup}`,
      wod && `WOD:\n${wod}`,
      notes && `Notes:\n${notes}`
    ].filter(Boolean);

    return sections.join('\n\n');
  };

  const handleExportCalendar = async () => {
    try {
      setIsExporting(true);
      await exportToCalendar(title, warmup, wod, notes, toast);
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
      const updates = await modifyWorkout(title, modificationPrompt, allWorkouts);
      
      setState({
        ...updates,
        strength: strength // Preserve strength when modifying
      });
      setModificationPrompt("");
      
      if (onUpdate) {
        onUpdate({
          ...updates,
          strength: strength
        });
      }

      toast({
        title: "Success",
        description: `${title}'s workout has been modified`,
      });
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
    <div className="space-y-2">
      <h3 className="text-center text-primary italic text-2xl font-collegiate uppercase tracking-wider">{title}</h3>
      <Card className="relative w-full animate-fade-in border-[4px] border-primary bg-muted shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[20px]">
        <audio ref={audioRef} className="hidden" />
        
        <WorkoutHeader
          title={title}
          isSpeaking={isSpeaking}
          isExporting={isExporting}
          onSpeak={() => handleSpeakWorkout(title, allWorkouts, warmup, wod, notes)}
          onExport={handleExportCalendar}
          warmup={warmup}
          wod={wod}
          notes={notes}
          strength={strength}
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
            label="Workout"
            value={formatWorkoutText()}
            onChange={() => {}}
            minHeight="200px"
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
    </div>
  );
}