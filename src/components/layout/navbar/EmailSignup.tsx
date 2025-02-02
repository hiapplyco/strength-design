import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";
import { UserPlus, Weight, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger 
} from "@/components/ui/drawer";
import { SidebarLogo } from "../sidebar/SidebarLogo";
import { SidebarNavigation } from "../sidebar/SidebarNavigation";

export const EmailSignup = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Weight className="h-8 w-8 text-accent animate-bounce" />
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent"
          >
            <LogOut className="h-6 w-6" />
          </Button>
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[95vh]">
              <DrawerHeader className="p-4">
                <SidebarLogo />
                <div className="mt-4">
                  <div className="text-sm font-medium text-muted-foreground">Navigation</div>
                  <div className="mt-2">
                    <SidebarNavigation />
                  </div>
                </div>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <UserPlus className="h-8 w-8 text-accent animate-bounce" />
      <Button
        onClick={() => setShowAuthDialog(true)}
        variant="ghost"
        className="text-muted-foreground hover:text-accent"
      >
        Sign up
      </Button>
      <AuthDialog
        showDialog={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  );
};