
import { ReactNode } from "react";
import { useSecureAuth } from "./SecureAuthProvider";
import { AuthDialog } from "./AuthDialog";
import { useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user, isLoading } = useSecureAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access this content.</p>
          <button
            onClick={() => setShowAuthDialog(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Sign In
          </button>
          <AuthDialog
            isOpen={showAuthDialog}
            onOpenChange={setShowAuthDialog}
            onSuccess={() => setShowAuthDialog(false)}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
