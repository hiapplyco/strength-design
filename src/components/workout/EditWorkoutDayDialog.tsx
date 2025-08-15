import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Edit3 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutDay } from "@/types/fitness";

interface EditWorkoutDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDay: WorkoutDay;
  dayNumber: number;
  cycleNumber: number;
  fitnessLevel?: string;
  onUpdate: (updatedDay: WorkoutDay) => void;
}

export function EditWorkoutDayDialog({
  open,
  onOpenChange,
  workoutDay,
  dayNumber,
  cycleNumber,
  fitnessLevel = "beginner",
  onUpdate
}: EditWorkoutDayDialogProps) {
  const [editRequest, setEditRequest] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleEdit = async () => {
    if (!editRequest.trim()) {
      toast({
        title: "Error",
        description: "Please describe what you'd like to change",
        variant: "destructive"
      });
      return;
    }

    setIsEditing(true);
    try {
      const editWorkoutDay = httpsCallable(functions, 'editWorkoutDay');
      const result = await editWorkoutDay({
        currentDay: workoutDay,
        userRequest: editRequest,
        dayNumber,
        cycleNumber,
        fitnessLevel
      });

      const data = result.data as any;
      if (data?.editedDay) {
        onUpdate(data.editedDay);
        onOpenChange(false);
        setEditRequest("");
        toast({
          title: "Success",
          description: "Workout day updated successfully"
        });
      }
    } catch (error) {
      console.error('Error editing workout day:', error);
      toast({
        title: "Error",
        description: "Failed to update workout day. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Day {dayNumber} Workout
          </DialogTitle>
          <DialogDescription>
            Describe what you'd like to change about this workout day. The AI will modify it based on your request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-request">What would you like to change?</Label>
            <Textarea
              id="edit-request"
              placeholder="Examples:
- Replace squats with lunges
- Make the workout easier
- Add more cardio exercises
- Focus on upper body only
- Remove jumping exercises"
              value={editRequest}
              onChange={(e) => setEditRequest(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isEditing}
            />
          </div>
          
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Current workout includes:</p>
            <p>• {workoutDay.description}</p>
            <p>• {workoutDay.warmup?.length || 0} warmup exercises</p>
            <p>• {workoutDay.workout?.length || 0} main exercises</p>
            <p>• {workoutDay.strength?.length || 0} strength exercises</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEditing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            disabled={isEditing || !editRequest.trim()}
          >
            {isEditing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Workout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}