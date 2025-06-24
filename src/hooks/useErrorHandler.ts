
import { useSmartToast } from "./useSmartToast";

export const useErrorHandler = () => {
  const { error } = useSmartToast();

  const handleError = (event: ErrorEvent) => {
    // Use the smart error classification system
    error(event, "Global Error Handler", {
      duration: 6000,
      action: {
        label: "Report",
        onClick: () => {
          console.log("Error reported:", event.message);
          // Could integrate with error reporting service here
        }
      }
    });
  };

  return handleError;
};
