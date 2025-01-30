import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { EmailSignup } from "./EmailSignup";
import { Activity, Video, Dumbbell } from "lucide-react";

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
        className={`${isMobile ? "w-full justify-start" : ""} gap-2`}
        variant="ghost"
        onClick={() => handleNavigation('/workout-generator')}
      >
        <Dumbbell className="h-4 w-4" />
        Workout Generator
      </Button>
      <Button
        className={`${isMobile ? "w-full justify-start" : ""} gap-2`}
        variant="ghost"
        onClick={() => handleNavigation('/video-analysis')}
      >
        <Video className="h-4 w-4" />
        Video Analysis
      </Button>
      <Button
        className={isMobile ? "w-full justify-start" : ""}
        variant="ghost"
        onClick={() => handleNavigation('/pricing')}
      >
        <Activity className="h-4 w-4" />
        Pricing
      </Button>
      <EmailSignup />
    </div>
  );
};