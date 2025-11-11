import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';
import type { NutritionLog, MealEntry, ExerciseEntry, FoodItem } from '../types';
import { COLLECTIONS } from '../types';

export class NutritionService {
  /**
   * Get or create nutrition log for a specific date
   */
  static async getOrCreateNutritionLog(userId: string, date: string): Promise<NutritionLog> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.NUTRITION_LOGS, date);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NutritionLog;
      }
      
      // Create new log
      const newLog: NutritionLog = {
        date,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        waterConsumedMl: 0,
        meals: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
        },
      };
      
      await setDoc(docRef, newLog);
      return { id: date, ...newLog };
    } catch (error) {
      console.error('Error getting/creating nutrition log:', error);
      throw error;
    }
  }

  /**
   * Update water intake
   */
  static async updateWaterIntake(userId: string, date: string, waterMl: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.NUTRITION_LOGS, date);
      await updateDoc(docRef, {
        waterConsumedMl: waterMl,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating water intake:', error);
      throw error;
    }
  }

  /**
   * Add meal entry
   */
  static async addMealEntry(
    userId: string, 
    date: string, 
    meal: Omit<MealEntry, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      // Ensure nutrition log exists
      await this.getOrCreateNutritionLog(userId, date);
      
      // Add meal entry
      const collectionRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.NUTRITION_LOGS, 
        date, 
        COLLECTIONS.MEALS
      );
      
      const docRef = await addDoc(collectionRef, {
        ...meal,
        createdAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding meal entry:', error);
      throw error;
    }
  }

  /**
   * Get meals for a specific date
   */
  static async getMealsForDate(userId: string, date: string): Promise<MealEntry[]> {
    try {
      const collectionRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.NUTRITION_LOGS, 
        date, 
        COLLECTIONS.MEALS
      );
      
      const q = query(collectionRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MealEntry[];
    } catch (error) {
      console.error('Error getting meals:', error);
      throw error;
    }
  }

  /**
   * Add exercise entry
   */
  static async addExerciseEntry(
    userId: string, 
    date: string, 
    exercise: Omit<ExerciseEntry, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      // Ensure nutrition log exists
      await this.getOrCreateNutritionLog(userId, date);
      
      // Add exercise entry
      const collectionRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.NUTRITION_LOGS, 
        date, 
        COLLECTIONS.EXERCISES_LOG
      );
      
      const docRef = await addDoc(collectionRef, {
        ...exercise,
        createdAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding exercise entry:', error);
      throw error;
    }
  }

  /**
   * Get nutrition logs for date range
   */
  static async getNutritionLogsForRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<NutritionLog[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.NUTRITION_LOGS);
      const q = query(
        collectionRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NutritionLog[];
    } catch (error) {
      console.error('Error getting nutrition logs:', error);
      throw error;
    }
  }

  /**
   * Search food items
   */
  static async searchFoodItems(searchTerm: string, limitCount: number = 20): Promise<FoodItem[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.FOOD_ITEMS);
      
      // Note: Firestore doesn't support full-text search natively
      // This is a simple prefix search on the name field
      const q = query(
        collectionRef,
        where('name', '>=', searchTerm.toLowerCase()),
        where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];
    } catch (error) {
      console.error('Error searching food items:', error);
      throw error;
    }
  }

  /**
   * Create custom food item
   */
  static async createFoodItem(
    userId: string, 
    foodItem: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<string> {
    try {
      const collectionRef = collection(db, COLLECTIONS.FOOD_ITEMS);
      const docRef = await addDoc(collectionRef, {
        ...foodItem,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating food item:', error);
      throw error;
    }
  }

  /**
   * Calculate daily nutrition totals
   */
  static async calculateDailyTotals(userId: string, date: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    waterMl: number;
    exerciseCalories: number;
  }> {
    try {
      const log = await this.getOrCreateNutritionLog(userId, date);
      const meals = await this.getMealsForDate(userId, date);
      
      let totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        waterMl: log.waterConsumedMl || 0,
        exerciseCalories: 0,
      };
      
      // Calculate meal totals
      meals.forEach(meal => {
        const multiplier = meal.servingMultiplier || 1;
        totals.calories += (meal.foodItem.caloriesPerServing || 0) * multiplier;
        totals.protein += (meal.foodItem.proteinPerServing || 0) * multiplier;
        totals.carbs += (meal.foodItem.carbsPerServing || 0) * multiplier;
        totals.fat += (meal.foodItem.fatPerServing || 0) * multiplier;
      });
      
      // Get exercise calories
      const exercisesRef = collection(
        db, 
        COLLECTIONS.USERS, 
        userId, 
        COLLECTIONS.NUTRITION_LOGS, 
        date, 
        COLLECTIONS.EXERCISES_LOG
      );
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      exercisesSnapshot.forEach(doc => {
        const exercise = doc.data() as ExerciseEntry;
        totals.exerciseCalories += exercise.caloriesBurned || 0;
      });
      
      return totals;
    } catch (error) {
      console.error('Error calculating daily totals:', error);
      throw error;
    }
  }

  /**
   * Get nutrition streak
   */
  static async getNutritionStreak(userId: string): Promise<number> {
    try {
      const today = new Date();
      let streak = 0;
      let currentDate = new Date(today);
      
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.NUTRITION_LOGS, dateStr);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          break;
        }
        
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        
        // Limit to prevent infinite loops
        if (streak > 365) break;
      }
      
      return streak;
    } catch (error) {
      console.error('Error getting nutrition streak:', error);
      return 0;
    }
  }
}