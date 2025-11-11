
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Firebase type definitions
interface WorkoutSession {
  id: string;
  user_id: string;
  generated_workout_id: string;
  scheduled_date: string;
  completed_date?: string | null;
  status: 'scheduled' | 'completed' | 'skipped';
  actual_duration_minutes?: number | null;
  perceived_exertion?: number | null;
  satisfaction_rating?: number | null;
  notes?: string | null;
  created_at?: any;
  updated_at?: any;
}

interface GeneratedWorkout {
  id: string;
  user_id: string;
  workout_data: any;
  title: string;
  summary?: string | null;
  tags?: string[];
  generated_at?: any;
}

export type WorkoutSessionWithGeneratedWorkout = WorkoutSession & {
  generated_workouts: GeneratedWorkout | null;
};

type WorkoutSessionInsert = Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>;
type WorkoutSessionUpdate = Partial<Omit<WorkoutSession, 'id' | 'user_id' | 'created_at'>>;

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState<WorkoutSessionWithGeneratedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const sessionsRef = collection(db, 'workout_sessions');
      const q = query(sessionsRef, orderBy('scheduled_date', 'desc'));
      const snapshot = await getDocs(q);

      // Fetch sessions with their related generated workouts
      const sessionsWithWorkouts = await Promise.all(
        snapshot.docs.map(async (sessionDoc) => {
          const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as WorkoutSession;

          // Fetch related generated workout if exists
          let generatedWorkout: GeneratedWorkout | null = null;
          if (sessionData.generated_workout_id) {
            try {
              const workoutRef = doc(db, 'generated_workouts', sessionData.generated_workout_id);
              const workoutSnap = await getDoc(workoutRef);
              if (workoutSnap.exists()) {
                generatedWorkout = { id: workoutSnap.id, ...workoutSnap.data() } as GeneratedWorkout;
              }
            } catch (err) {
              console.warn('Could not fetch generated workout:', err);
            }
          }

          return {
            ...sessionData,
            generated_workouts: generatedWorkout
          } as WorkoutSessionWithGeneratedWorkout;
        })
      );

      setSessions(sessionsWithWorkouts);
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
      const sessionsRef = collection(db, 'workout_sessions');
      const docRef = await addDoc(sessionsRef, {
        ...session,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Fetch the created session with its generated workout
      const newSession: WorkoutSession = {
        id: docRef.id,
        ...session,
      };

      let generatedWorkout: GeneratedWorkout | null = null;
      if (session.generated_workout_id) {
        const workoutRef = doc(db, 'generated_workouts', session.generated_workout_id);
        const workoutSnap = await getDoc(workoutRef);
        if (workoutSnap.exists()) {
          generatedWorkout = { id: workoutSnap.id, ...workoutSnap.data() } as GeneratedWorkout;
        }
      }

      const newSessionWithWorkout: WorkoutSessionWithGeneratedWorkout = {
        ...newSession,
        generated_workouts: generatedWorkout
      };

      setSessions(prev => [newSessionWithWorkout, ...prev]);
      toast({
        title: "Success",
        description: "Workout session scheduled successfully"
      });

      return newSessionWithWorkout;
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
      const sessionRef = doc(db, 'workout_sessions', id);
      await updateDoc(sessionRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });

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
