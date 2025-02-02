import { NavLink } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
          className="text-muted-foreground hover:text-accent"
        >
          <LogOut className="h-6 w-6" />
        </Button>
        <SidebarTrigger>
          <Menu className="h-6 w-6" />
        </SidebarTrigger>
      </div>
    </div>
  );
};