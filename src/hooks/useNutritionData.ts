
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const useNutritionData = (date: Date) => {
  const currentUser = auth.currentUser;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dateString = format(date, 'yyyy-MM-dd');

  // Get or create nutrition log for the date
  const { data: nutritionLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ['nutrition-log', currentUser?.uid, dateString],
    queryFn: async () => {
      if (!currentUser?.uid) throw new Error('User not authenticated');

      // Try to get existing log
      const logsRef = collection(db, 'nutrition_logs');
      const q = query(
        logsRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateString)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // If no log exists, create one
      const newLogRef = await addDoc(logsRef, {
        user_id: currentUser.uid,
        date: dateString,
        water_consumed_ml: 0,
        created_at: serverTimestamp(),
      });

      return { id: newLogRef.id, user_id: currentUser.uid, date: dateString, water_consumed_ml: 0 };
    },
    enabled: !!currentUser?.uid,
  });

  // Get nutrition targets
  const { data: targets, isLoading: isLoadingTargets } = useQuery({
    queryKey: ['nutrition-targets', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) throw new Error('User not authenticated');

      const targetsRef = collection(db, 'nutrition_targets');
      const q = query(targetsRef, where('user_id', '==', currentUser.uid));

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // If no targets exist, create default ones
      const newTargetsRef = await addDoc(targetsRef, {
        user_id: currentUser.uid,
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fat: 65,
        daily_water_ml: 2000,
        created_at: serverTimestamp(),
      });

      return {
        id: newTargetsRef.id,
        user_id: currentUser.uid,
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fat: 65,
        daily_water_ml: 2000
      };
    },
    enabled: !!currentUser?.uid,
  });

  const isLoading = isLoadingLog || isLoadingTargets;

  return {
    nutritionLog,
    targets,
    isLoading
  };
};
