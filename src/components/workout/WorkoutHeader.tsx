import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "./header/HeaderActions";
import { WorkoutModifier } from "./WorkoutModifier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";

interface WorkoutHeaderProps {
  title: string;
  isSpeaking: boolean;
  isPaused?: boolean;
  isExporting: boolean;
  onSpeak: () => void;
  onExport: () => void;
  warmup: string;
  workout: string;
  notes?: string;
  strength: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
  onUpdate?: (updates: { warmup: string; workout: string; notes?: string; strength: string; description?: string; }) => void;
}

export function WorkoutHeader({
  title,
  isSpeaking,
  isPaused,
  isExporting,
  onSpeak,
  onExport,
  warmup,
  workout,
  notes,
  strength,
  allWorkouts,
  onUpdate
}: WorkoutHeaderProps) {
  const [showModifier, setShowModifier] = useState(false);
  const { toast } = useToast();

  const handleModify = async (modificationPrompt: string) => {
    try {
      const response = await fetch('https://ulnsvkrrdcmfiguibkpx.supabase.co/functions/v1/workout-modifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayToModify: title,
          modificationPrompt,
          allWorkouts
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to modify workout');
      }

      const modifiedWorkout = await response.json();
      
      if (onUpdate) {
        onUpdate(modifiedWorkout);
        triggerConfetti(); // Trigger confetti on successful modification
        toast({
          title: "Success",
          description: "Workout modified successfully!",
        });
      }
      
      setShowModifier(false);
    } catch (error: any) {
      console.error('Error modifying workout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to modify workout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-oswald text-primary">{title}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModifier(true)}
          className="text-sm"
        >
          Modify
        </Button>
      </div>

      <HeaderActions
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        isExporting={isExporting}
        onSpeak={onSpeak}
        onExport={onExport}
      />

      <Dialog open={showModifier} onOpenChange={setShowModifier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Workout for {title}</DialogTitle>
          </DialogHeader>
          <WorkoutModifier
            onModify={handleModify}
            currentWorkout={{ warmup, workout, notes: notes || '', strength }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}