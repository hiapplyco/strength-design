
import React from "react";
import { useProAccess } from "@/hooks/useProAccess";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProFeatureWrapperProps {
  children: React.ReactNode;
  featureName: string;
  className?: string;
  showUpgradePrompt?: boolean;
}

export const ProFeatureWrapper: React.FC<ProFeatureWrapperProps> = ({
  children,
  featureName,
  className,
  showUpgradePrompt = true,
}) => {
  const { isProUser, isAuthenticated, isLoading } = useProAccess();
  const navigate = useNavigate();

  // Since we now handle auth at the route level, we assume user is authenticated here
  if (isLoading) {
    return (
      <div className={cn("opacity-50 pointer-events-none", className)}>
        {children}
      </div>
    );
  }

  // For features that require Pro access
  if (!isProUser && showUpgradePrompt) {
    return (
      <div className={cn("relative", className)}>
        <div className="opacity-30 pointer-events-none grayscale">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <Crown className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm font-medium mb-2">{featureName} - Pro Feature</p>
            <Button 
              size="sm" 
              onClick={() => navigate("/pricing")}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};
