import { useSmartToast } from "./useSmartToast";

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
    // This is now handled by the smart toast classification system
    // Keeping for backward compatibility
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
