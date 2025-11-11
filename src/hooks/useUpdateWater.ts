
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const useUpdateWater = () => {
  const currentUser = auth.currentUser;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateWaterMutation = useMutation({
    mutationFn: async ({ date, amount }: { date: Date; amount: number }) => {
      if (!currentUser) throw new Error('User not authenticated');

      const dateString = format(date, 'yyyy-MM-dd');

      // Find the nutrition log for this date
      const nutritionLogsRef = collection(db, 'nutrition_logs');
      const logsQuery = query(
        nutritionLogsRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateString)
      );

      const logsSnapshot = await getDocs(logsQuery);

      if (logsSnapshot.empty) {
        throw new Error('Nutrition log not found for this date');
      }

      const logDoc = logsSnapshot.docs[0];
      await updateDoc(doc(db, 'nutrition_logs', logDoc.id), {
        water_consumed_ml: Math.max(0, amount),
        updated_at: serverTimestamp(),
      });
    },
    onSuccess: (_, { date }) => {
      const dateString = format(date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({
        queryKey: ['nutrition-log', currentUser?.uid, dateString]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update water intake",
        variant: "destructive",
      });
    },
  });

  return {
    updateWater: updateWaterMutation.mutate,
    isUpdating: updateWaterMutation.isPending,
  };
};
