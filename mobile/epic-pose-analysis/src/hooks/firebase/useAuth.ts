import { useState, useEffect, useCallback } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserService } from '@/lib/firebase/services';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Create user profile if it doesn't exist
      if (firebaseUser) {
        try {
          const profile = await UserService.getUserProfile(firebaseUser.uid);
          if (!profile) {
            await UserService.createUserProfile(firebaseUser.uid, {
              tier: 'free',
              freeWorkoutsUsed: 0,
              trialEndDate: null,
            });
          }
        } catch (error) {
          console.error('Error checking/creating user profile:', error);
        }
      }
      
      setLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Create user profile
      await UserService.createUserProfile(userCredential.user.uid, {
        tier: 'free',
        freeWorkoutsUsed: 0,
        trialEndDate: null,
      });
      
      return { user: userCredential.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if new user and create profile
      const profile = await UserService.getUserProfile(userCredential.user.uid);
      if (!profile) {
        await UserService.createUserProfile(userCredential.user.uid, {
          tier: 'free',
          freeWorkoutsUsed: 0,
          trialEndDate: null,
        });
      }
      
      return { user: userCredential.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }, []);

  const setupPhoneRecaptcha = useCallback(async (containerId: string) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
        });
      }
      await window.recaptchaVerifier.render();
    } catch (error) {
      console.error('Error setting up recaptcha:', error);
      throw error;
    }
  }, []);

  const signInWithPhone = useCallback(async (phoneNumber: string) => {
    try {
      if (!window.recaptchaVerifier) {
        throw new Error('Recaptcha not initialized');
      }
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      
      window.confirmationResult = confirmationResult;
      return { confirmationResult, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { confirmationResult: null, error: authError };
    }
  }, []);

  const verifyPhoneCode = useCallback(async (code: string) => {
    try {
      if (!window.confirmationResult) {
        throw new Error('No confirmation result available');
      }
      
      const userCredential = await window.confirmationResult.confirm(code);
      
      // Check if new user and create profile
      const profile = await UserService.getUserProfile(userCredential.user.uid);
      if (!profile) {
        await UserService.createUserProfile(userCredential.user.uid, {
          tier: 'free',
          freeWorkoutsUsed: 0,
          trialEndDate: null,
        });
      }
      
      return { user: userCredential.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { user: null, error: authError };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Clean up recaptcha
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined as any;
      }
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { error: authError };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Error",
        description: authError.message,
        variant: "destructive",
      });
      return { error: authError };
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      await updateProfile(user, updates);
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { error: authError };
    }
  }, [user]);

  return {
    user,
    loading,
    isInitialized,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneCode,
    setupPhoneRecaptcha,
    logout,
    resetPassword,
    updateUserProfile,
  };
}