import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SidebarLogo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  return (
    <div className="flex items-center justify-between">
      <NavLink
        to="/workout-generator"
        className="text-2xl font-collegiate text-accent tracking-wider hover:text-accent/80 transition-colors"
      >
        STRENGTH.DESIGN
      </NavLink>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          title="Logout"
          className="text-muted-foreground hover:text-accent transition-colors"
        >
          <LogOut className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="ghost"
          size="icon"
          title="Upgrade"
          className="text-muted-foreground hover:text-accent transition-colors"
        >
          <Star className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};