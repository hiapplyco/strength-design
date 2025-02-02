import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  FileText, 
  Video, 
  DollarSign,
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

  const navItems = [
    { path: '/workout-generator', icon: <Dumbbell className="h-4 w-4" />, text: 'Generate Program' },
    { path: '/generated-workouts', icon: <FileText className="h-4 w-4" />, text: 'Previous Programs' },
    { path: '/video-analysis', icon: <Video className="h-4 w-4" />, text: 'Publish Program' },
    { path: '/pricing', icon: <DollarSign className="h-4 w-4" />, text: 'Upgrade to Pro' },
  ];

  return (
    <nav className={cn(
      "flex items-center gap-2",
      isMobile ? "flex-col space-y-2" : "space-x-4 lg:space-x-6"
    )}>
      {navItems.map((item) => (
        <Button 
          key={item.path}
          asChild 
          variant="ghost" 
          className="text-white text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
          onClick={handleClick}
        >
          <Link to={item.path}>
            {item.icon}
            <span>{item.text}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
};