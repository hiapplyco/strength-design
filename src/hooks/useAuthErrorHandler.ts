
import { useToast } from "@/hooks/use-toast";

export const useAuthErrorHandler = () => {
  const { toast } = useToast();

  const handleAuthError = (error: any, context: string) => {
    console.error(`Auth error in ${context}:`, error);
    
    // Don't expose internal error details to users
    const sanitizedMessage = getSanitizedErrorMessage(error);
    
    toast({
      title: "Authentication Error",
      description: sanitizedMessage,
      variant: "destructive",
    });
  };

  const getSanitizedErrorMessage = (error: any): string => {
    if (typeof error?.message === 'string') {
      // Return safe, user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please check your credentials.';
      }
      if (error.message.includes('already registered')) {
        return 'This email is already registered. Please try signing in.';
      }
      if (error.message.includes('Email not confirmed')) {
        return 'Please check your email and click the confirmation link.';
      }
      if (error.message.includes('rate limit')) {
        return 'Too many attempts. Please try again later.';
      }
    }
    
    // Generic fallback message
    return 'An error occurred. Please try again.';
  };

  return { handleAuthError };
};
