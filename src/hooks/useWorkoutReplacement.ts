import { useState } from 'react';
import { useWorkoutSessions } from './useWorkoutSessions';
import { useToast } from './use-toast';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import type { WeeklyWorkouts } from '@/types/fitness';
import { isWorkoutDay, isWorkoutCycle } from '@/types/fitness';

export const useWorkoutReplacement = () => {
  const [isReplacing, setIsReplacing] = useState(false);
  const { sessions, refetch } = useWorkoutSessions();
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const replaceWorkouts = async (newWorkouts: WeeklyWorkouts): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    setIsReplacing(true);
    try {
      // Delete existing scheduled workouts (keep completed ones)
      const sessionsRef = collection(db, 'workout_sessions');
      const q = query(
        sessionsRef,
        where('user_id', '==', currentUser.uid),
        where('status', '==', 'scheduled')
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Create new generated_workout entry
      const workoutsRef = collection(db, 'generated_workouts');
      const generatedWorkoutRef = await addDoc(workoutsRef, {
        user_id: currentUser.uid,
        workout_data: newWorkouts,
        title: newWorkouts._meta?.title || 'Replacement Workout Plan',
        summary: newWorkouts._meta?.summary || '',
        tags: ['replaced'],
        generated_at: serverTimestamp(),
      });

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
          user_id: currentUser.uid,
          generated_workout_id: generatedWorkoutRef.id,
          scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
          status: 'scheduled' as const,
          created_at: serverTimestamp(),
        };
      });

      // Batch insert workout sessions
      const sessionBatch = writeBatch(db);
      workoutSessions.forEach(session => {
        const sessionRef = collection(db, 'workout_sessions');
        const newSessionRef = addDoc(sessionRef, session);
      });

      // Use Promise.all for multiple addDoc operations
      await Promise.all(
        workoutSessions.map(session =>
          addDoc(collection(db, 'workout_sessions'), session)
        )
      );

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
