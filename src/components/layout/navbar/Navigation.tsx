import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  FileText, 
  ScrollText, 
  Video, 
  DollarSign,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavigationProps {
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
}

export const Navigation = ({ isMobile, onMobileMenuClose }: NavigationProps) => {
  const handleClick = () => {
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <nav className={cn(
      "flex items-center gap-2",
      isMobile ? "flex-col space-y-2" : "space-x-4 lg:space-x-6"
    )}>
      <Button 
        asChild 
        variant="ghost" 
        className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
        onClick={handleClick}
      >
        <Link to="/workout-generator">
          <Dumbbell className="h-4 w-4" />
          Generate Workout
        </Link>
      </Button>
      <Button 
        asChild 
        variant="ghost" 
        className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
        onClick={handleClick}
      >
        <Link to="/generated-workouts">
          <FileText className="h-4 w-4" />
          My Workouts
        </Link>
      </Button>
      <Button 
        asChild 
        variant="ghost" 
        className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
        onClick={handleClick}
      >
        <Link to="/document-editor">
          <ScrollText className="h-4 w-4" />
          Document Editor
        </Link>
      </Button>
      <Button 
        asChild 
        variant="ghost" 
        className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
        onClick={handleClick}
      >
        <Link to="/video-analysis">
          <Video className="h-4 w-4" />
          Video Analysis
        </Link>
      </Button>
      <Button 
        asChild 
        variant="ghost" 
        className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
        onClick={handleClick}
      >
        <Link to="/pricing">
          <DollarSign className="h-4 w-4" />
          Pricing
        </Link>
      </Button>
    </nav>
  );
};