import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";
import { UserPlus, Weight, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";

export const EmailSignup = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Weight className="h-8 w-8 text-accent animate-bounce" />
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent"
          >
            <LogOut className="h-6 w-6" />
          </Button>
          <Button 
            onClick={toggleSidebar}
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-accent"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <UserPlus className="h-8 w-8 text-accent animate-bounce" />
      <Button
        onClick={() => setShowAuthDialog(true)}
        variant="ghost"
        className="text-muted-foreground hover:text-accent"
      >
        Sign up
      </Button>
      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          setShowAuthDialog(false);
          navigate("/workout-generator");
        }}
      />
    </div>
  );
};