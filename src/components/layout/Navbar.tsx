import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, UserRound, Home, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { User } from "@supabase/supabase-js";

export const Navbar = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      setUser(session?.user || null);
      if (_event === 'SIGNED_OUT') {
        toast({
          title: "Signed out successfully",
          description: "Come back soon!",
        });
        // Ensure mobile menu is closed after sign out
        setIsMobileMenuOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error.message);
        throw error;
      }
      
      // Force clear the user state immediately
      setUser(null);
      // Close mobile menu
      setIsMobileMenuOpen(false);
      
      // Show immediate feedback to user
      toast({
        title: "Signing out...",
        description: "Please wait...",
      });
      
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "An unexpected error occurred",
      });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-2xl font-collegiate text-primary tracking-wider">STRENGTH.DESIGN</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                <Button
                  variant="ghost"
                  className="hover:bg-destructive hover:text-white"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthDialog(true)}>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 mr-2" />
              ) : (
                <Moon className="h-5 w-5 mr-2" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>

            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-destructive hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                className="w-full justify-start"
                onClick={() => setShowAuthDialog(true)}
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        )}
      </div>

      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </nav>
  );
};