import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
    <nav className={`${isMobile ? 'flex flex-col space-y-2' : 'flex items-center space-x-4'}`}>
      <Link to="/workout-generator" onClick={handleClick}>
        <Button variant="ghost">Workout Generator</Button>
      </Link>
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