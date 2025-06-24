
import { toast } from "sonner";
import { useCallback } from "react";

// Error classification types
type ErrorSeverity = "low" | "medium" | "high" | "critical";
type ErrorCategory = "network" | "validation" | "auth" | "system" | "user";

interface SmartToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

interface ErrorClassification {
  severity: ErrorSeverity;
  category: ErrorCategory;
  userMessage: string;
  actionable?: boolean;
  retryable?: boolean;
}

export const useSmartToast = () => {
  // Classify errors intelligently
  const classifyError = useCallback((error: any): ErrorClassification => {
    const message = error?.message?.toLowerCase() || "";
    
    // Network errors
    if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
      return {
        severity: "medium",
        category: "network",
        userMessage: "Connection issue. Please check your internet and try again.",
        actionable: true,
        retryable: true
      };
    }
    
    // Authentication errors
    if (message.includes("unauthorized") || message.includes("authentication") || message.includes("login")) {
      return {
        severity: "high",
        category: "auth",
        userMessage: "Please sign in to continue.",
        actionable: true,
        retryable: false
      };
    }
    
    // Validation errors
    if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
      return {
        severity: "low",
        category: "validation",
        userMessage: "Please check your input and try again.",
        actionable: true,
        retryable: false
      };
    }
    
    // Workout limit errors
    if (message.includes("workout_limit_exceeded") || message.includes("limit reached")) {
      return {
        severity: "medium",
        category: "user",
        userMessage: "You've reached your workout limit. Upgrade to Pro for unlimited access!",
        actionable: true,
        retryable: false
      };
    }
    
    // Edge function errors
    if (message.includes("edge function") || message.includes("server error")) {
      return {
        severity: "high",
        category: "system",
        userMessage: "Service temporarily unavailable. Please try again in a moment.",
        actionable: true,
        retryable: true
      };
    }
    
    // Default classification
    return {
      severity: "medium",
      category: "system",
      userMessage: "Something went wrong. Please try again.",
      actionable: true,
      retryable: true
    };
  }, []);

  // Smart duration calculation based on content and severity
  const calculateDuration = useCallback((message: string, severity: ErrorSeverity): number => {
    const baseTime = 2000;
    const wordCount = message.split(" ").length;
    const readingTime = wordCount * 200; // 200ms per word
    
    const severityMultiplier = {
      low: 1,
      medium: 1.5,
      high: 2,
      critical: 0 // Critical errors don't auto-dismiss
    };
    
    const duration = Math.max(baseTime, readingTime) * severityMultiplier[severity];
    return severity === "critical" ? Infinity : duration;
  }, []);

  // Success toast
  const success = useCallback((message: string, options?: SmartToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      position: options?.position
    });
  }, []);

  // Info toast
  const info = useCallback((message: string, options?: SmartToastOptions) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      position: options?.position
    });
  }, []);

  // Warning toast
  const warning = useCallback((message: string, options?: SmartToastOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true,
      position: options?.position
    });
  }, []);

  // Smart error handling
  const error = useCallback((error: any, context?: string, options?: SmartToastOptions) => {
    console.error(`Error in ${context || "application"}:`, error);
    
    const classification = classifyError(error);
    const duration = calculateDuration(classification.userMessage, classification.severity);
    
    // Build action button if retryable
    let action = options?.action;
    if (classification.retryable && !action) {
      action = {
        label: "Retry",
        onClick: () => {
          // This would be handled by the calling component
          console.log("Retry action triggered");
        }
      };
    }

    return toast.error(classification.userMessage, {
      duration: options?.duration || duration,
      action,
      dismissible: options?.dismissible ?? true,
      position: options?.position
    });
  }, [classifyError, calculateDuration]);

  // Loading toast with promise handling
  const loading = useCallback((
    promise: Promise<any>,
    messages: {
      loading: string;
      success: string;
      error?: string;
    },
    options?: SmartToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error) => {
        const classification = classifyError(error);
        return messages.error || classification.userMessage;
      },
      duration: options?.duration,
      action: options?.action,
      dismissible: options?.dismissible,
      position: options?.position
    });
  }, [classifyError]);

  // Batch operations to prevent spam
  const batch = useCallback((toasts: Array<() => void>) => {
    // Limit to 3 toasts at once
    const limitedToasts = toasts.slice(0, 3);
    
    limitedToasts.forEach((toastFn, index) => {
      setTimeout(() => toastFn(), index * 100); // Stagger by 100ms
    });
    
    if (toasts.length > 3) {
      setTimeout(() => {
        info(`${toasts.length - 3} more notifications available`, {
          duration: 2000
        });
      }, 400);
    }
  }, [info]);

  return {
    success,
    info,
    warning,
    error,
    loading,
    batch,
    dismiss: toast.dismiss,
    dismissAll: () => toast.dismiss()
  };
};
