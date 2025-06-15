
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Target, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

export const WorkoutScheduler = () => {
  const [availableWorkouts, setAvailableWorkouts] = useState<GeneratedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isOpen, setIsOpen] = useState(false);
  const { createSession } = useWorkoutSessions();

  useEffect(() => {
    fetchAvailableWorkouts();
  }, []);

  const fetchAvailableWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_workouts')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAvailableWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const handleScheduleWorkout = async () => {
    if (!selectedWorkout || !selectedDate) return;

    const success = await createSession({
      generated_workout_id: selectedWorkout,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      status: 'scheduled',
      user_id: (await supabase.auth.getUser()).data.user?.id || ''
    });

    if (success) {
      setSelectedWorkout('');
      setSelectedDate(undefined);
      setIsOpen(false);
    }
  };

  const selectedWorkoutData = availableWorkouts.find(w => w.id === selectedWorkout);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Schedule Workout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Workout</label>
          <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a workout to schedule" />
            </SelectTrigger>
            <SelectContent>
              {availableWorkouts.map(workout => (
                <SelectItem key={workout.id} value={workout.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{workout.title || 'Untitled Workout'}</span>
                    <span className="text-xs text-muted-foreground">
                      {workout.tags?.slice(0, 2).join(', ')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedWorkoutData && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">{selectedWorkoutData.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedWorkoutData.summary}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {selectedWorkoutData.estimated_duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedWorkoutData.estimated_duration_minutes} min
                    </div>
                  )}
                  {selectedWorkoutData.difficulty_level && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Level {selectedWorkoutData.difficulty_level}/10
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule Date</label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button 
          onClick={handleScheduleWorkout}
          disabled={!selectedWorkout || !selectedDate}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Workout
        </Button>
      </CardContent>
    </Card>
  );
};
