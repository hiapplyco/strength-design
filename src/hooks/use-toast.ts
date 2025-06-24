
import { useSmartToast } from "./useSmartToast";

// Legacy toast options interface for backward compatibility
interface LegacyToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Main hook that provides all smart toast functionality with backward compatibility
export const useToast = () => {
  const smartToast = useSmartToast();
  
  // Legacy toast function that accepts both string and object parameters
  const legacyToast = (options: LegacyToastOptions | string) => {
    if (typeof options === 'string') {
      return smartToast.success(options);
    }
    
    const message = options.description ? `${options.title}: ${options.description}` : options.title;
    
    if (options.variant === 'destructive') {
      return smartToast.error(new Error(message), undefined, { duration: options.duration });
    }
    
    return smartToast.success(message, { duration: options.duration });
  };
  
  return {
    // Smart toast functions
    ...smartToast,
    // Legacy toast function for backward compatibility
    toast: legacyToast,
    // Empty toasts array for components that might still reference it
    toasts: []
  };
};

// Direct toast functions for convenient access with backward compatibility
export const toast = (options: LegacyToastOptions | string) => {
  const { toast: toastFn } = useToast();
  return toastFn(options);
};

// Named export variants for convenience
toast.success = (message: string) => {
  const { success } = useSmartToast();
  return success(message);
};

toast.error = (error: any, context?: string) => {
  const { error: errorFn } = useSmartToast();
  return errorFn(error, context);
};

toast.info = (message: string) => {
  const { info } = useSmartToast();
  return info(message);
};

toast.warning = (message: string) => {
  const { warning } = useSmartToast();
  return warning(message);
};
