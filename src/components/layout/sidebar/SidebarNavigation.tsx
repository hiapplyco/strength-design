
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Sparkles,
  History,
  Book,
  Dumbbell,
  MessageSquare,
  FileText,
  Video,
  CreditCard,
  LogIn,
  LogOut,
  Crown,
  Apple,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProAccess } from "@/hooks/useProAccess";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isPro?: boolean;
  isDisabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isPro = false, isDisabled = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isProUser } = useProAccess();
  const isActive = location.pathname === to;

  const handleClick = (e: React.MouseEvent) => {
    if (isPro && !isProUser) {
      e.preventDefault();
      navigate("/pricing");
      return;
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        "group flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground relative",
        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
        isPro && !isProUser && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <span>{label}</span>
        {isPro && (
          <Crown className="h-3 w-3 text-amber-500 ml-auto" />
        )}
      </div>
    </Link>
  );
};

export const SidebarNavigation = () => {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
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

  return (
    <div className="px-4 py-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Navigation</div>
      <nav className="space-y-1">
        <NavItem to="/" icon={<Home className="h-5 w-5" />} label="Home" />
        <NavItem
          to="/workout-generator"
          icon={<Sparkles className="h-5 w-5" />}
          label="Workout Generator"
        />
        <NavItem
          to="/generated-workouts"
          icon={<History className="h-5 w-5" />}
          label="Previous Programs"
          isPro={true}
        />
        <NavItem
          to="/journal"
          icon={<Book className="h-5 w-5" />}
          label="Journal"
          isPro={true}
        />
        <NavItem
          to="/nutrition-diary"
          icon={<Apple className="h-5 w-5" />}
          label="Nutrition Diary"
          isPro={true}
        />
        <NavItem
          to="/movement-analysis"
          icon={<Dumbbell className="h-5 w-5" />}
          label="Movement Analysis"
          isPro={true}
        />
        <NavItem
          to="/program-chat"
          icon={<MessageSquare className="h-5 w-5" />}
          label="Program Chat"
          isPro={true}
        />
        <NavItem
          to="/document-editor"
          icon={<FileText className="h-5 w-5" />}
          label="Document Editor"
          isPro={true}
        />
        <NavItem
          to="/publish-program"
          icon={<Video className="h-5 w-5" />}
          label="Publish Program"
          isPro={true}
        />
        <NavItem
          to="/pricing"
          icon={<CreditCard className="h-5 w-5" />}
          label="Pricing"
        />
        
        {/* Auth Section */}
        <div className="pt-4 border-t border-border">
          {user ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-secondary-foreground hover:bg-secondary"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              onClick={() => setShowAuthDialog(true)}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-secondary-foreground hover:bg-secondary"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign In
            </Button>
          )}
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
    </div>
  );
};
