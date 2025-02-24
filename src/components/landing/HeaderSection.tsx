
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoHeader } from "@/components/ui/logo-header";

export const HeaderSection = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/workout-generator');
  };

  return (
    <header className="w-full py-12 relative backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <LogoHeader>strength.design</LogoHeader>
        </motion.div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => setShowAuthDialog(true)}
            className="bg-destructive text-white hover:bg-destructive/90 font-bold text-lg px-8 py-6 rounded-lg"
          >
            Get Started - Sign Up Now
          </Button>
        </div>

        <AuthDialog 
          isOpen={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </header>
  );
};
