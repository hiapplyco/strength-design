import { useToast } from "@/hooks/use-toast";

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (event: ErrorEvent) => {
    // Check if it's an Edge Function error
    if (event.message.includes('Edge Function')) {
      toast({
        title: "Server Error",
        description: "The workout generation service is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    // Check for accessibility warnings
    if (event.message.includes('DialogContent')) {
      console.warn('Accessibility warning:', event.message);
      return;
    }

    // General error handling
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  };

  return handleError;
};