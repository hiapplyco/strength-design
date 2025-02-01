import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";
import { UserPlus, Weight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const EmailSignup = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    navigate('/workout-generator');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Weight className="h-8 w-8 text-accent animate-bounce" />
        <Button 
          onClick={handleLogout}
          variant="ghost"
          className="text-muted-foreground hover:text-accent flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setShowAuthDialog(true)}
        variant="default"
        className="bg-accent hover:bg-accent/90 text-black font-bold flex items-center gap-2 relative z-[10000]"
      >
        <UserPlus className="h-4 w-4" />
        Sign Up / Log In
      </Button>

      <AuthDialog 
        isOpen={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};