import { CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { modifyWorkout } from "@/utils/workout";
import { HeaderActions } from "./header/HeaderActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");

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
    if (!allWorkouts || !onUpdate || !modificationPrompt.trim()) return;
    
    setIsModifying(true);
    setShowModifyDialog(false);
    
    try {
      const updates = await modifyWorkout(title, modificationPrompt, allWorkouts);
      
      const convertedUpdates = {
        ...updates,
        workout: updates.workout,
        strength: strength // Preserve strength when modifying
      };

      onUpdate(convertedUpdates);

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
      setModificationPrompt("");
    }
  };

  return (
    <>
      <CardHeader className="relative border-b-[4px] border-primary bg-card rounded-t-[20px]">
        <div className="flex items-center justify-between">
          <h3 className="text-primary italic text-2xl font-collegiate uppercase tracking-wider">
            {title}
          </h3>
          <HeaderActions
            onShare={handleShare}
            onSpeak={onSpeak}
            onExport={onExport}
            onModify={() => setShowModifyDialog(true)}
            isSpeaking={isSpeaking}
            isExporting={isExporting}
            isModifying={isModifying}
            showModify={!!allWorkouts && !!onUpdate}
          />
        </div>
      </CardHeader>

      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modify Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Add equipment, notes, or change it up..."
              value={modificationPrompt}
              onChange={(e) => setModificationPrompt(e.target.value)}
              className="border-2 border-primary"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModifyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleModify}
                disabled={!modificationPrompt.trim()}
              >
                Modify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}