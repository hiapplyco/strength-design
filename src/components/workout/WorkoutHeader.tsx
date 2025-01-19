import { CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { modifyWorkout } from "@/utils/workout";
import { HeaderActions } from "./header/HeaderActions";

interface WorkoutHeaderProps {
  title: string;
  isSpeaking: boolean;
  isExporting: boolean;
  onSpeak: () => void;
  onExport: () => void;
  warmup?: string;
  workout?: string;
  notes?: string;
  strength?: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
  onUpdate?: (updates: { warmup: string; workout: string; notes?: string; strength: string; description?: string; }) => void;
}

export function WorkoutHeader({ 
  title, 
  isSpeaking, 
  isExporting, 
  onSpeak, 
  onExport,
  warmup = "",
  workout = "",
  notes = "",
  strength = "",
  allWorkouts,
  onUpdate
}: WorkoutHeaderProps) {
  const { toast } = useToast();
  const [isModifying, setIsModifying] = useState(false);

  const formatWorkoutText = () => {
    const sections = [
      `${title}`,
      strength && `Strength:\n${strength}`,
      warmup && `Warmup:\n${warmup}`,
      workout && `Workout:\n${workout}`,
      notes && `Notes:\n${notes}`
    ].filter(Boolean);

    return sections.join('\n\n');
  };

  const handleShare = async () => {
    const workoutText = formatWorkoutText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title}`,
          text: workoutText,
        });
        toast({
          title: "Success",
          description: "Workout shared successfully",
        });
      } else {
        await navigator.clipboard.writeText(workoutText);
        toast({
          title: "Copied to clipboard",
          description: "The workout details have been copied to your clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Sharing failed",
        description: "Unable to share the workout. The details have been copied to your clipboard instead.",
        variant: "destructive",
      });
      try {
        await navigator.clipboard.writeText(workoutText);
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
      }
    }
  };

  const handleModify = async () => {
    if (!allWorkouts || !onUpdate) return;
    
    setIsModifying(true);
    try {
      const updates = await modifyWorkout(title, "Make this workout easier", allWorkouts);
      
      onUpdate({
        ...updates,
        strength
      });

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
    <CardHeader className="relative border-b-[4px] border-primary bg-card rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <h3 className="text-primary italic text-2xl font-collegiate uppercase tracking-wider">
          {title}
        </h3>
        <HeaderActions
          onShare={handleShare}
          onSpeak={onSpeak}
          onExport={onExport}
          onModify={handleModify}
          isSpeaking={isSpeaking}
          isExporting={isExporting}
          isModifying={isModifying}
          showModify={!!allWorkouts && !!onUpdate}
        />
      </div>
    </CardHeader>
  );
}