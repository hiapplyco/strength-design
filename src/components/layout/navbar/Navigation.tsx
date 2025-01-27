import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { EmailSignup } from "./EmailSignup";

export const Navigation = ({ isMobile = false, onMobileMenuClose }: { isMobile?: boolean; onMobileMenuClose?: () => void }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <div className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-4'}`}>
      <Button
        className={isMobile ? "w-full justify-start" : ""}
        variant="ghost"
        onClick={() => handleNavigation('/pricing')}
      >
        Pricing
      </Button>
      <EmailSignup />
    </div>
  );
};