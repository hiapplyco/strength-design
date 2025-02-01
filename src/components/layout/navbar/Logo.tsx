import { Home, LogIn, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Logo = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="p-0"
        >
          <Home className="h-6 w-6 text-primary hover:text-primary/80 transition-colors" />
        </Button>
        <span className="text-2xl font-collegiate text-primary tracking-wider">
          STRENGTH.DESIGN
        </span>
      </div>
      
      <div className="flex gap-2 mt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/pricing')}
          className="p-1"
        >
          <DollarSign className="h-5 w-5 text-primary hover:text-primary/80 transition-colors" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/login')}
          className="p-1"
        >
          <LogIn className="h-5 w-5 text-primary hover:text-primary/80 transition-colors" />
        </Button>
      </div>
    </div>
  );
};