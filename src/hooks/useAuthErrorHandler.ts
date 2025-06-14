
import { useToast } from "@/hooks/use-toast";

export const useAuthErrorHandler = () => {
  const { toast } = useToast();

  const handleAuthError = (error: any, context: string) => {
    console.error(`Auth error in ${context}:`, error);
    
    // SECURITY FIX: Don't expose internal error details to users
    const sanitizedMessage = getSanitizedErrorMessage(error);
    
    toast({
      title: "Authentication Error",
      description: sanitizedMessage,
      variant: "destructive",
    });
  };

  const getSanitizedErrorMessage = (error: any): string => {
    // SECURITY FIX: Only return safe, user-friendly messages
    if (typeof error?.message === 'string') {
      const message = error.message.toLowerCase();
      
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
    
    // Generic fallback message - never expose internal errors
    return 'An error occurred. Please try again.';
  };

  return { handleAuthError };
};
