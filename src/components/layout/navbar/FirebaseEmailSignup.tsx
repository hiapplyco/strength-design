import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, Weight, LogOut, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export const EmailSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useFirebaseAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button 
          onClick={handleLogout} 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-accent"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={() => navigate("/auth")} 
        variant="ghost" 
        className="text-muted-foreground hover:text-accent flex items-center gap-2"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
    </div>
  );
};