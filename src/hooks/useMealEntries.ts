
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

export const useMealEntries = (nutritionLogId?: string, mealGroup?: string) => {
  const { data: mealEntries, isLoading } = useQuery({
    queryKey: ['meal-entries', nutritionLogId, mealGroup],
    queryFn: async () => {
      if (!nutritionLogId || !mealGroup) return [];

      const mealEntriesRef = collection(db, 'meal_entries');
      const q = query(
        mealEntriesRef,
        where('nutrition_log_id', '==', nutritionLogId),
        where('meal_group', '==', mealGroup),
        orderBy('created_at', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const entries = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const entryData = { id: docSnapshot.id, ...docSnapshot.data() };

          // Fetch related food_item
          if (entryData.food_item_id) {
            const foodItemDoc = await getDoc(doc(db, 'food_items', entryData.food_item_id));
            if (foodItemDoc.exists()) {
              entryData.food_items = { id: foodItemDoc.id, ...foodItemDoc.data() };
            }
          }

          return entryData;
        })
      );

      return entries;
    },
    enabled: !!nutritionLogId && !!mealGroup
  });

  // Calculate meal summary
  const mealSummary = React.useMemo(() => {
    if (!mealEntries?.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return mealEntries.reduce((acc, entry: any) => {
      const multiplier = entry.serving_multiplier;
      return {
        calories: acc.calories + (entry.food_items.calories_per_serving * multiplier),
        protein: acc.protein + (entry.food_items.protein_per_serving * multiplier),
        carbs: acc.carbs + (entry.food_items.carbs_per_serving * multiplier),
        fat: acc.fat + (entry.food_items.fat_per_serving * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealEntries]);

  return {
    mealEntries,
    mealSummary,
    isLoading
  };
};
