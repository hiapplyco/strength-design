import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, FileText } from "lucide-react";
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
      "flex items-center",
      isMobile ? "flex-col space-y-2" : "space-x-4 lg:space-x-6"
    )}>
      <Button 
        asChild 
        variant="ghost" 
        className="text-sm font-medium transition-colors hover:text-primary"
        onClick={handleClick}
      >
        <Link to="/workout-generator" className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Generate Workout
        </Link>
      </Button>
      <Button 
        asChild 
        variant="ghost" 
        className="text-sm font-medium transition-colors hover:text-primary"
        onClick={handleClick}
      >
        <Link to="/generated-workouts" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          My Workouts
        </Link>
      </Button>
      <Link to="/document-editor" onClick={handleClick}>
        <Button variant="ghost">Document Editor</Button>
      </Link>
      <Link to="/video-analysis" onClick={handleClick}>
        <Button variant="ghost">Video Analysis</Button>
      </Link>
      <Link to="/pricing" onClick={handleClick}>
        <Button variant="ghost">Pricing</Button>
      </Link>
    </nav>
  );
};