
import { useSmartToast } from "./useSmartToast";

// Main hook that provides all smart toast functionality
export const useToast = () => {
  const smartToast = useSmartToast();
  
  // Return both the smart toast functions and a legacy toast function for backward compatibility
  return {
    // Smart toast functions
    ...smartToast,
    // Legacy toast function for backward compatibility
    toast: smartToast.success,
    // Empty toasts array for components that might still reference it
    toasts: []
  };
};

// Direct toast functions for convenient access
export const toast = {
  success: (message: string) => {
    const { success } = useSmartToast();
    return success(message);
  },
  error: (error: any, context?: string) => {
    const { error: errorFn } = useSmartToast();
    return errorFn(error, context);
  },
  info: (message: string) => {
    const { info } = useSmartToast();
    return info(message);
  },
  warning: (message: string) => {
    const { warning } = useSmartToast();
    return warning(message);
  },
};
