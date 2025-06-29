
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { AuthForm } from "./AuthForm";
import { useAuthState } from "./useAuthState";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "./SocialAuthButtons";

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AuthDialog = ({ isOpen, onOpenChange, onSuccess }: AuthDialogProps) => {
  const { error, view, setView } = useAuthState(isOpen, onOpenChange, onSuccess);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-2 border-border/50 shadow-2xl">
        <DialogHeader className="text-center space-y-2 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {view === "sign_up" ? "Create Account" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>
        {error && <AuthErrorAlert error={error} />}
        <AuthForm view={view} onSuccess={onSuccess} />
        
        <div className="mt-4">
          <SocialAuthButtons />
        </div>
        
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setView(view === "sign_up" ? "sign_in" : "sign_up")}
            className="text-sm text-muted-foreground hover:text-foreground"
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
