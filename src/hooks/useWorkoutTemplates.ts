
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSmartToast } from '@/hooks/useSmartToast';
import type { WeeklyWorkouts } from '@/types/fitness';

export const useWorkoutTemplates = () => {
  const queryClient = useQueryClient();
  const { success, error } = useSmartToast();
  const currentUser = auth.currentUser;

  const { data: workoutTemplates, isLoading } = useQuery({
    queryKey: ['workout-templates', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error('Not authenticated');

      const workoutsRef = collection(db, 'generated_workouts');
      const q = query(
        workoutsRef,
        where('user_id', '==', currentUser.uid),
        orderBy('generated_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!currentUser?.uid,
  });

  const saveWorkoutTemplate = useMutation({
    mutationFn: async (workout: WeeklyWorkouts) => {
      if (!currentUser) throw new Error('Not authenticated');

      const workoutTitle = workout._meta?.title || 'Generated Workout';
      const workoutSummary = workout._meta?.summary || '';

      const workoutsRef = collection(db, 'generated_workouts');
      const docRef = await addDoc(workoutsRef, {
        user_id: currentUser.uid,
        title: workoutTitle,
        summary: workoutSummary,
        workout_data: workout,
        estimated_duration_minutes: 60,
        generated_at: serverTimestamp(),
      });

      return { id: docRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
      success('Workout saved successfully!');
    },
    onError: (err: any) => {
      error(err, 'Workout Save');
    }
  });

  return {
    workoutTemplates,
    isLoading,
    saveWorkoutTemplate: saveWorkoutTemplate.mutateAsync,
    isSaving: saveWorkoutTemplate.isPending
  };
};
