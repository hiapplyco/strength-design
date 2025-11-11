import { useState } from "react";

export const useAuthState = (
  isOpen: boolean,
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void,
) => {
  const [error, setError] = useState<string>("");
  const [view, setView] = useState<"sign_up" | "sign_in">("sign_in");

  return {
    error,
    setError,
    view,
    setView,
  };
};