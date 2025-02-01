import { Link } from "react-router-dom";
import { Home, FileText, Dumbbell, Video, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <Link to="/">
                <Home className="h-6 w-6" />
              </Link>
            </Button>
            <span className="text-2xl font-collegiate text-accent tracking-wider">
              STRENGTH.DESIGN
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Button 
              asChild 
              variant="ghost" 
              className="text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
            >
              <Link to="/document-editor">
                <FileText className="h-5 w-5" />
                <span>Documents</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
            >
              <Link to="/workout-generator">
                <Dumbbell className="h-5 w-5" />
                <span>Workouts</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
            >
              <Link to="/video-analysis">
                <Video className="h-5 w-5" />
                <span>Videos</span>
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
            >
              <Link to="/pricing">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};