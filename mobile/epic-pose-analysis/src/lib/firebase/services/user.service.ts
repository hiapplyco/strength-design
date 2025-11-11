import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config';
import type { UserProfile, FitnessProfile, NutritionSettings, Subscription } from '../types';
import { COLLECTIONS } from '../types';

export class UserService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Create user profile
   */
  static async createUserProfile(userId: string, data: Partial<UserProfile> = {}): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const profile: UserProfile = {
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        tier: 'free',
        freeWorkoutsUsed: 0,
        trialEndDate: null,
        ...data,
      };
      
      await setDoc(docRef, profile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update fitness profile
   */
  static async updateFitnessProfile(userId: string, data: Partial<FitnessProfile>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, {
        fitnessProfile: data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating fitness profile:', error);
      throw error;
    }
  }

  /**
   * Update nutrition settings
   */
  static async updateNutritionSettings(userId: string, data: Partial<NutritionSettings>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, {
        nutritionSettings: data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating nutrition settings:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(userId: string, data: Partial<Subscription>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, {
        subscription: data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user has pro/premium access
   */
  static async hasProAccess(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return false;
      
      // Check tier
      if (profile.tier === 'pro' || profile.tier === 'premium') {
        return true;
      }
      
      // Check subscription status
      if (profile.subscription?.status === 'active' || profile.subscription?.status === 'trialing') {
        return true;
      }
      
      // Check trial period
      if (profile.trialEndDate && profile.trialEndDate.toDate() > new Date()) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking pro access:', error);
      return false;
    }
  }

  /**
   * Increment free workouts used
   */
  static async incrementFreeWorkoutsUsed(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      await this.updateUserProfile(userId, {
        freeWorkoutsUsed: (profile.freeWorkoutsUsed || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing free workouts:', error);
      throw error;
    }
  }
}