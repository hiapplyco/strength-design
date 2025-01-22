import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { AuthForm } from "./AuthForm";
import { useAuthState } from "./useAuthState";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isNewUser?: boolean;
}

export const AuthDialog = ({ isOpen, onOpenChange, onSuccess, isNewUser = true }: AuthDialogProps) => {
  const { error, view } = useAuthState(isOpen, onOpenChange, onSuccess, isNewUser);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-oswald">
            {view === "sign_up" ? "Start Your 7-Day Free Trial" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        <AuthErrorAlert error={error} />
        <AuthForm view={view} />
      </DialogContent>
    </Dialog>
  );
};