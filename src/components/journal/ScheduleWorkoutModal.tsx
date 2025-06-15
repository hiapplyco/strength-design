
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Zap, Clock } from "lucide-react";

type ScheduleWorkoutModalProps = { open: boolean; onOpenChange: (o: boolean) => void; };

export const ScheduleWorkoutModal = ({ open, onOpenChange }: ScheduleWorkoutModalProps) => {
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { createSession } = useWorkoutSessions();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch list of user's workouts
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("generated_workouts").select("*").order("generated_at", { ascending: false }).limit(15);
      setAvailableWorkouts(data || []);
    })();
  }, [open]);

  // Smart suggestion (pick the first workout or last scheduled + 1 day as default)
  useEffect(() => {
    if (availableWorkouts.length > 0 && !selectedWorkout) {
      setSelectedWorkout(availableWorkouts[0].id);
    }
  }, [availableWorkouts, selectedWorkout]);

  const handleSchedule = async () => {
    if (!selectedWorkout || !selectedDate) return;
    setSubmitting(true);
    await createSession({
      generated_workout_id: selectedWorkout,
      scheduled_date: format(selectedDate, "yyyy-MM-dd"),
      status: "scheduled",
      user_id: (await supabase.auth.getUser()).data.user?.id || "",
    });
    setSubmitting(false);
    setSelectedDate(undefined);
    setSelectedWorkout("");
    onOpenChange(false);
  };

  const workout = availableWorkouts.find((w) => w.id === selectedWorkout);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a New Workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-1">
          <div>
            <label className="text-sm font-medium">Choose Workout</label>
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
              <SelectTrigger>
                <SelectValue placeholder="Select workout" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkouts.map((w) => (
                  <SelectItem value={w.id} key={w.id}>
                    <span className="font-medium">{w.title || "Untitled"}</span>
                    {w.tags?.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">{w.tags.slice(0,2).join(", ")}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {workout && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-medium">{workout.title}</div>
                  <div className="text-xs text-muted-foreground">{workout.summary}</div>
                  <div className="flex gap-4 mt-2 text-xs">
                    {workout.estimated_duration_minutes && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.estimated_duration_minutes} min</span>
                    )}
                    {workout.difficulty_level && (
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" />Level {workout.difficulty_level}/10</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div>
            <label className="text-sm font-medium">Schedule Date</label>
            <div className="rounded-md border bg-background mt-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleSchedule}
            disabled={!selectedWorkout || !selectedDate || submitting}
            loading={submitting}
          >
            Schedule Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
