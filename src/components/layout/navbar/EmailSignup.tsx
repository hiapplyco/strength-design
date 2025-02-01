import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";

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
      >
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