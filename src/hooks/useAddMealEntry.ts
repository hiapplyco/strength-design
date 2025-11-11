
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { NormalizedFood } from '@/services/usdaApi';

interface AddMealEntryParams {
  foodId?: string;
  usdaFood?: NormalizedFood;
  mealGroup: string;
  date: Date;
  amount: number;
  servingMultiplier: number;
}

export const useAddMealEntry = () => {
  const currentUser = auth.currentUser;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (params: AddMealEntryParams) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { foodId, usdaFood, mealGroup, date, amount, servingMultiplier } = params;
      const dateString = format(date, 'yyyy-MM-dd');

      let finalFoodId = foodId;

      // If it's a USDA food, save it to our food_items table first
      if (usdaFood && !foodId) {
        try {
          const foodItemsRef = collection(db, 'food_items');
          const docRef = await addDoc(foodItemsRef, {
            name: usdaFood.name,
            brand: usdaFood.brand,
            serving_size: usdaFood.serving_size.toString(),
            serving_unit: usdaFood.serving_unit,
            calories_per_serving: usdaFood.calories_per_serving,
            protein_per_serving: usdaFood.protein_per_serving,
            carbs_per_serving: usdaFood.carbs_per_serving,
            fat_per_serving: usdaFood.fat_per_serving,
            fiber_per_serving: usdaFood.fiber_per_serving || 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          finalFoodId = docRef.id;
        } catch (saveError) {
          console.error('Error saving USDA food:', saveError);
          throw new Error('Failed to save USDA food to database');
        }
      }

      if (!finalFoodId) {
        throw new Error('No food ID provided');
      }

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

      // Add meal entry
      const mealEntriesRef = collection(db, 'meal_entries');
      const mealEntryRef = await addDoc(mealEntriesRef, {
        nutrition_log_id: logId,
        food_item_id: finalFoodId,
        meal_group: mealGroup,
        amount: amount,
        serving_multiplier: servingMultiplier,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      return { id: mealEntryRef.id };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
      queryClient.invalidateQueries({ queryKey: ['meal-entries'] });
      
      toast({
        title: "Success",
        description: "Food added to diary successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding meal entry:', error);
      toast({
        title: "Error",
        description: "Failed to add food to diary. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addMealEntry: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
};
