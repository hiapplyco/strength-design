import { useSmartToast } from "./useSmartToast";
import { AuthError } from "firebase/auth";

export const useAuthErrorHandler = () => {
  const { error } = useSmartToast();

  const handleAuthError = (authError: any, context: string) => {
    console.error(`Auth error in ${context}:`, authError);
    
    // The smart toast will automatically classify and handle auth errors appropriately
    error(authError, `Authentication - ${context}`, {
      action: {
        label: "Sign In",
        onClick: () => {
          // Redirect to sign in or open auth dialog
          window.location.href = "/";
        }
      }
    });
  };

  const getSanitizedErrorMessage = (authError: any): string => {
    if (authError?.code) {
      // Firebase Auth error codes
      switch (authError.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          return 'Invalid email or password. Please check your credentials.';
        
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please try signing in.';
        
        case 'auth/weak-password':
          return 'Please choose a stronger password with at least 12 characters.';
        
        case 'auth/too-many-requests':
          return 'Too many attempts. Please try again later.';
        
        case 'auth/network-request-failed':
          return 'Network error. Please check your connection and try again.';
        
        case 'auth/user-disabled':
          return 'This account has been disabled. Please contact support.';
        
        case 'auth/requires-recent-login':
          return 'Please sign in again to complete this action.';
        
        case 'auth/invalid-verification-code':
          return 'Invalid verification code. Please try again.';
        
        case 'auth/invalid-phone-number':
          return 'Invalid phone number. Please check and try again.';
        
        case 'auth/missing-phone-number':
          return 'Please enter a phone number.';
        
        case 'auth/quota-exceeded':
          return 'SMS quota exceeded. Please try again later.';
        
        case 'auth/captcha-check-failed':
          return 'Captcha verification failed. Please try again.';
          
        case 'auth/popup-closed-by-user':
          return 'Sign in was cancelled.';
          
        case 'auth/popup-blocked':
          return 'Pop-up blocked. Please allow pop-ups for this site.';
          
        case 'auth/account-exists-with-different-credential':
          return 'An account already exists with the same email address but different sign-in credentials.';
      }
    }
    
    // Legacy Supabase error handling for compatibility
    if (typeof authError?.message === 'string') {
      const message = authError.message.toLowerCase();
      
      if (message.includes('invalid login credentials') || message.includes('invalid email')) {
        return 'Invalid email or password. Please check your credentials.';
      }
      if (message.includes('already registered') || message.includes('user already registered')) {
        return 'This email is already registered. Please try signing in.';
      }
      if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
        return 'Please check your email and click the confirmation link.';
      }
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'Too many attempts. Please try again later.';
      }
      if (message.includes('weak password') || message.includes('password')) {
        return 'Please choose a stronger password with at least 12 characters.';
      }
    }
    
    return 'An error occurred. Please try again.';
  };

  return { handleAuthError, getSanitizedErrorMessage };
};