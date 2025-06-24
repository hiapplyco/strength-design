
import { useSmartToast } from "./useSmartToast";

// Re-export the smart toast hook as the main toast interface
export const useToast = useSmartToast;

// For backward compatibility, also export the toast functions directly
export const toast = {
  success: (message: string) => useSmartToast().success(message),
  error: (error: any, context?: string) => useSmartToast().error(error, context),
  info: (message: string) => useSmartToast().info(message),
  warning: (message: string) => useSmartToast().warning(message),
};
