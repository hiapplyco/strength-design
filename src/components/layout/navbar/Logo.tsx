
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";

export const Logo = () => {
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const handleAuthSuccess = () => {
    navigate('/workout-generator');
  };
  
  return (
    <div className="flex flex-col items-center max-w-full px-4">
      <div className="flex items-center space-x-4 w-full overflow-hidden">
        <span className="text-2xl font-collegiate text-primary tracking-wider transform -skew-x-12 truncate hover:text-primary/80 transition-colors cursor-pointer"
          onClick={() => navigate('/')}
        >
          STRENGTH.DESIGN
        </span>
      </div>
      
      <div className="flex gap-2 mt-2">
        <Button
          variant="ghost"
          onClick={() => setShowAuthDialog(true)}
          className="text-primary hover:text-primary/80 transition-colors text-sm"
        >
          Sign Up / Sign In
        </Button>
      </div>

      <AuthDialog 
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
