import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

export const EmailSignup = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/workout-generator');
  };

  return (
    <>
      <Button 
        onClick={() => setShowAuthDialog(true)}
        variant="default"
        className="bg-accent hover:bg-accent/90 text-black font-bold flex items-center gap-2"
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