
import { Link } from "react-router-dom";
import { Home, FileText, Dumbbell, Video, DollarSign, MessageSquare, BarChart3, Upload, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./navbar/MobileMenu";
import { useState } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const navItems = [
    { path: '/workout-generator', icon: <Dumbbell className="h-5 w-5" />, text: 'Generate Program' },
    { path: '/generated-workouts', icon: <FileText className="h-5 w-5" />, text: 'Previous Programs' },
    { path: '/publish-program', icon: <Upload className="h-5 w-5" />, text: 'Publish Program' },
    { path: '/video-analysis', icon: <Video className="h-5 w-5" />, text: 'Video Tools' },
    { path: '/program-chat', icon: <MessageSquare className="h-5 w-5" />, text: 'Program Chat' },
    { path: '/slam-mova', icon: <BarChart3 className="h-5 w-5" />, text: 'MoVA Platform', highlight: true },
    { path: '/pricing', icon: <DollarSign className="h-5 w-5" />, text: 'Upgrade to Pro' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <Link to="/" aria-label="Home">
                <Home className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-2xl font-collegiate text-accent tracking-wider">
              <Link to="/" className="hover:text-accent/80 transition-colors">
                STRENGTH.DESIGN
              </Link>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button 
                key={item.path}
                asChild 
                variant="ghost" 
                className={`text-accent hover:text-accent/80 transition-colors flex items-center gap-2 ${
                  item.highlight ? 'bg-primary/20 ring-1 ring-primary/30' : ''
                }`}
              >
                <Link to={item.path}>
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Auth Button for Desktop */}
            <div className="hidden md:block">
              {user ? (
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-accent hover:text-accent/80 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowAuthDialog(true)}
                  variant="ghost"
                  className="text-accent hover:text-accent/80 flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <MobileMenu />
            </div>
          </div>
        </div>
      </div>
      
      <AuthDialog 
        isOpen={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        onSuccess={() => {
          setShowAuthDialog(false);
          navigate("/workout-generator");
        }} 
      />
    </nav>
  );
};
