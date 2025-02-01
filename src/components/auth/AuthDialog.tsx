import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { AuthForm } from "./AuthForm";
import { useAuthState } from "./useAuthState";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AuthDialog = ({ isOpen, onOpenChange, onSuccess }: AuthDialogProps) => {
  const { error, view, setView } = useAuthState(isOpen, onOpenChange, onSuccess);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === "sign_up" ? "Create Account" : "Sign In"}
          </DialogTitle>
        </DialogHeader>
        {error && <AuthErrorAlert error={error} />}
        <AuthForm view={view} onSuccess={onSuccess} />
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setView(view === "sign_up" ? "sign_in" : "sign_up")}
            className="text-sm"
          >
            {view === "sign_up" 
              ? "Already have an account? Sign in" 
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};