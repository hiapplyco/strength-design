
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];
export type WorkoutSessionWithGeneratedWorkout = WorkoutSession & {
  generated_workouts: GeneratedWorkout | null;
};
type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert'];
type WorkoutSessionUpdate = Database['public']['Tables']['workout_sessions']['Update'];

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState<WorkoutSessionWithGeneratedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          generated_workouts:generated_workout_id(*)
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load workout sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (session: WorkoutSessionInsert): Promise<WorkoutSessionWithGeneratedWorkout | null> => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert(session)
        .select(`
          *,
          generated_workouts:generated_workout_id(*)
        `)
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Workout session scheduled successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating workout session:', error);
      toast({
        title: "Error",
        description: "Failed to schedule workout session",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSession = async (id: string, updates: WorkoutSessionUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.map(session => 
        session.id === id ? { ...session, ...updates } : session
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating workout session:', error);
      toast({
        title: "Error",
        description: "Failed to update workout session",
        variant: "destructive"
      });
      return false;
    }
  };

  const completeSession = async (id: string, metrics: {
    actual_duration_minutes?: number;
    perceived_exertion?: number;
    satisfaction_rating?: number;
    notes?: string;
  }): Promise<boolean> => {
    const updates: WorkoutSessionUpdate = {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      ...metrics
    };

    return updateSession(id, updates);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    isLoading,
    createSession,
    updateSession,
    completeSession,
    refetch: fetchSessions
  };
};
