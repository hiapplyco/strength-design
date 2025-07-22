import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/firebase/useAuth';
import { workoutQueries } from '@/lib/firebase/db/queries';
import { WorkoutSession, GeneratedWorkout } from '@/lib/firebase/db/types';

export type WorkoutSessionWithGeneratedWorkout = WorkoutSession & {
  generated_workouts: GeneratedWorkout | null;
};

type WorkoutSessionInsert = Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
type WorkoutSessionUpdate = Partial<WorkoutSessionInsert>;

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState<WorkoutSessionWithGeneratedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const createSession = async (session: WorkoutSessionInsert): Promise<WorkoutSessionWithGeneratedWorkout | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule workout sessions",
        variant: "destructive"
      });
      return null;
    }

    try {
      const sessionId = await workoutQueries.createWorkoutSession(user.uid, session);
      
      // Fetch the generated workout if it exists
      let generatedWorkout = null;
      if (session.generated_workout_id) {
        const workoutDoc = await getDoc(doc(db, `users/${user.uid}/workouts`, session.generated_workout_id));
        if (workoutDoc.exists()) {
          generatedWorkout = { id: workoutDoc.id, ...workoutDoc.data() } as GeneratedWorkout;
        }
      }

      toast({
        title: "Success",
        description: "Workout session scheduled successfully"
      });
      
      return {
        ...session,
        id: sessionId,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        generated_workouts: generatedWorkout
      } as WorkoutSessionWithGeneratedWorkout;
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
    if (!user) return false;

    try {
      await workoutQueries.updateWorkoutSession(user.uid, id, updates);
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
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/workout_sessions`),
      orderBy('scheduled_date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const sessionsData: WorkoutSessionWithGeneratedWorkout[] = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const sessionData = docSnapshot.data() as WorkoutSession;
            
            // Fetch the generated workout if it exists
            let generatedWorkout = null;
            if (sessionData.generated_workout_id) {
              const workoutDoc = await getDoc(doc(db, `users/${user.uid}/workouts`, sessionData.generated_workout_id));
              if (workoutDoc.exists()) {
                generatedWorkout = { id: workoutDoc.id, ...workoutDoc.data() } as GeneratedWorkout;
              }
            }
            
            return {
              ...sessionData,
              id: docSnapshot.id,
              generated_workouts: generatedWorkout
            } as WorkoutSessionWithGeneratedWorkout;
          })
        );
        
        setSessions(sessionsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching workout sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load workout sessions",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  return {
    sessions,
    isLoading,
    createSession,
    updateSession,
    completeSession,
    refetch: () => {} // Real-time updates handle this automatically
  };
};