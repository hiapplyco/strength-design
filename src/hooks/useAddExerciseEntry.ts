
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddExerciseEntryParams {
  exerciseName: string;
  durationMinutes: number;
  caloriesBurned: number;
  mealGroup: string;
  date: Date;
  workoutData?: any;
}

export const useAddExerciseEntry = () => {
  const currentUser = auth.currentUser;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (params: AddExerciseEntryParams) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { exerciseName, durationMinutes, caloriesBurned, mealGroup, date, workoutData } = params;
      const dateString = format(date, 'yyyy-MM-dd');

      // Get or create nutrition log for the date
      const nutritionLogsRef = collection(db, 'nutrition_logs');
      const logsQuery = query(
        nutritionLogsRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateString)
      );

      const logsSnapshot = await getDocs(logsQuery);
      let logId: string;

      if (logsSnapshot.empty) {
        // Create new log if doesn't exist
        const newLogRef = await addDoc(nutritionLogsRef, {
          user_id: currentUser.uid,
          date: dateString,
          water_consumed_ml: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        logId = newLogRef.id;
      } else {
        logId = logsSnapshot.docs[0].id;
      }

      // Add exercise entry
      const exerciseEntriesRef = collection(db, 'exercise_entries');
      const exerciseEntryRef = await addDoc(exerciseEntriesRef, {
        nutrition_log_id: logId,
        exercise_name: exerciseName,
        duration_minutes: durationMinutes,
        calories_burned: caloriesBurned,
        meal_group: mealGroup,
        workout_data: workoutData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      return { id: exerciseEntryRef.id };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
      queryClient.invalidateQueries({ queryKey: ['meal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-entries'] });
      
      toast({
        title: "Success",
        description: "Exercise added to diary successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise to diary. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addExerciseEntry: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
};
