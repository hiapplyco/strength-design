import { useState } from 'react';
import { useWorkoutSessions } from './useWorkoutSessions';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import type { WeeklyWorkouts } from '@/types/fitness';
import { isWorkoutDay, isWorkoutCycle } from '@/types/fitness';

export const useWorkoutReplacement = () => {
  const [isReplacing, setIsReplacing] = useState(false);
  const { sessions, refetch } = useWorkoutSessions();
  const { toast } = useToast();
  const { session } = useAuth();

  const replaceWorkouts = async (newWorkouts: WeeklyWorkouts): Promise<boolean> => {
    if (!session?.user?.id) return false;

    setIsReplacing(true);
    try {
      // Delete existing scheduled workouts (keep completed ones)
      const { error: deleteError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('status', 'scheduled');

      if (deleteError) throw deleteError;

      // Create new generated_workout entry
      const { data: generatedWorkout, error: workoutError } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          workout_data: newWorkouts as any,
          title: newWorkouts._meta?.title || 'Replacement Workout Plan',
          summary: newWorkouts._meta?.summary || '',
          tags: ['replaced']
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Prepare workout events
      const events: Array<{
        title: string;
        dayOffset: number;
      }> = [];

      let dayOffset = 0;
      Object.entries(newWorkouts)
        .filter(([key]) => key !== '_meta')
        .forEach(([key, value]) => {
          if (isWorkoutCycle(value)) {
            const cycleTitle = key.charAt(0).toUpperCase() + key.slice(1);
            
            Object.entries(value)
              .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
              .forEach(([dayKey]) => {
                events.push({
                  title: `${cycleTitle} - ${dayKey.replace(/day(\d+)/, 'Day $1')}`,
                  dayOffset: dayOffset++
                });
              });
          } else if (isWorkoutDay(value)) {
            events.push({
              title: key.replace(/day(\d+)/, 'Day $1'),
              dayOffset: dayOffset++
            });
          }
        });

      // Create new workout sessions starting from today
      const startDate = new Date();
      const workoutSessions = events.map(event => {
        const scheduledDate = addDays(startDate, event.dayOffset);
        return {
          user_id: session.user.id,
          generated_workout_id: generatedWorkout.id,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          status: 'scheduled' as const
        };
      });

      const { error: sessionsError } = await supabase
        .from('workout_sessions')
        .insert(workoutSessions);

      if (sessionsError) throw sessionsError;

      await refetch();
      
      toast({
        title: "Workouts Replaced Successfully",
        description: `Your ${events.length} new workout sessions have been scheduled starting today.`
      });

      return true;
    } catch (error) {
      console.error('Error replacing workouts:', error);
      toast({
        title: "Error",
        description: "Failed to replace workouts. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsReplacing(false);
    }
  };

  const getScheduledWorkoutCount = () => {
    return sessions.filter(session => session.status === 'scheduled').length;
  };

  return {
    replaceWorkouts,
    isReplacing,
    getScheduledWorkoutCount
  };
};
