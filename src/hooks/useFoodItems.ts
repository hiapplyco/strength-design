
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const useFoodItems = (searchQuery: string) => {
  const { data: foodItems = [], isLoading } = useQuery({
    queryKey: ['food-items', searchQuery],
    queryFn: async () => {
      const foodItemsRef = collection(db, 'food_items');

      if (searchQuery) {
        // Firebase doesn't support case-insensitive search directly
        // We'll fetch all items and filter client-side for now
        // For production, consider using Algolia or similar for better search
        const q = query(
          foodItemsRef,
          orderBy('name', 'asc'),
          limit(50)
        );

        const querySnapshot = await getDocs(q);
        const allItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Client-side case-insensitive filtering
        const searchLower = searchQuery.toLowerCase();
        return allItems.filter((item: any) =>
          item.name?.toLowerCase().includes(searchLower)
        );
      } else {
        // If no search query, get all items (limited to 50)
        const q = query(
          foodItemsRef,
          orderBy('name', 'asc'),
          limit(50)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    },
    enabled: searchQuery.length >= 2 || searchQuery === '',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    foodItems,
    isLoading
  };
};
