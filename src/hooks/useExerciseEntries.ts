
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export const useExerciseEntries = (nutritionLogId?: string, mealGroup?: string) => {
  const { data: exerciseEntries, isLoading } = useQuery({
    queryKey: ['exercise-entries', nutritionLogId, mealGroup],
    queryFn: async () => {
      if (!nutritionLogId || !mealGroup) return [];

      const exerciseEntriesRef = collection(db, 'exercise_entries');
      const q = query(
        exerciseEntriesRef,
        where('nutrition_log_id', '==', nutritionLogId),
        where('meal_group', '==', mealGroup),
        orderBy('created_at', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!nutritionLogId && !!mealGroup
  });

  return {
    exerciseEntries,
    isLoading
  };
};
