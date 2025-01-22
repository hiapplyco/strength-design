import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "./header/HeaderActions";
import { WorkoutModifier } from "./WorkoutModifier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";

interface WorkoutHeaderProps {
  title: string;
  isExporting: boolean;
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
  isExporting,
  onExport,
  warmup,
  workout,
  notes,
  strength,
  allWorkouts,
  onUpdate
}: WorkoutHeaderProps) {
  const [showModifier, setShowModifier] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const { toast } = useToast();

  const formatDayTitle = (title: string) => {
    const dayNumber = title.replace(/([A-Z])/g, ' $1').trim().split(' ')[1];
    return `Day ${dayNumber}`;
  };

  const handleModify = async (prompt: string) => {
    setIsModifying(true);
    try {
      const response = await fetch('https://ulnsvkrrdcmfiguibkpx.supabase.co/functions/v1/workout-modifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayToModify: title,
          modificationPrompt: prompt,
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
        triggerConfetti();
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
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-oswald text-primary">{formatDayTitle(title)}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModifier(true)}
          className="text-sm"
        >
          Edit Workout
        </Button>
      </div>

      <HeaderActions
        isExporting={isExporting}
        onExport={onExport}
        onShare={() => {
          navigator.share?.({
            title: `Workout for ${title}`,
            text: `Check out this workout for ${title}!`,
          }).catch(console.error);
        }}
      />

      <Dialog open={showModifier} onOpenChange={setShowModifier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Workout for {formatDayTitle(title)}</DialogTitle>
          </DialogHeader>
          <WorkoutModifier
            title={title}
            modificationPrompt={modificationPrompt}
            isModifying={isModifying}
            onModificationPromptChange={setModificationPrompt}
            onModify={handleModify}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}