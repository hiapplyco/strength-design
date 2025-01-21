import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, UserRound } from "lucide-react";

export const Navbar = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // Check initial auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user || null);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
  };

  return (
    <nav className="fixed top-0 right-0 p-4 z-50">
      {user ? (
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          <Button
            variant="ghost"
            className="hover:bg-destructive hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      ) : (
        <Button onClick={() => setShowAuthDialog(true)}>
          <LogIn className="h-5 w-5 mr-2" />
          Sign In
        </Button>
      )}
      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </nav>
  );
};