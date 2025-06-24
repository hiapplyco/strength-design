import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Sparkles, 
  Crown, 
  MessageSquare, 
  BarChart3, 
  Apple,
  Book,
  Video,
  CheckCircle,
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spacing, typography } from "@/lib/design-tokens";

interface AuthRequiredWrapperProps {
  children: React.ReactNode;
  featureName: string;
  description: string;
}

const FREE_FEATURES = [
  "3 FREE AI-powered workout programs",
  "Up to a month of specialized workouts",
  "Tailored to your goals & equipment",
  "Professional-grade exercise programming"
];

const PRO_FEATURES = [
  { name: "Program Chat", icon: MessageSquare, description: "AI personal coach with your data" },
  { name: "Nutrition Diary", icon: Apple, description: "Complete macro tracking" },
  { name: "Movement Analysis", icon: BarChart3, description: "Advanced video analysis" },
  { name: "Smart Journal", icon: Book, description: "Progress tracking & insights" },
  { name: "Publish Program", icon: Video, description: "Create workout videos" },
  { name: "Workout History", icon: Dumbbell, description: "Access all past workouts" }
];

export const AuthRequiredWrapper: React.FC<AuthRequiredWrapperProps> = ({
  children,
  featureName,
  description
}) => {
  const { user, isLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Don't show anything while loading to prevent flicker
  if (isLoading) {
    return null;
  }

  // If user is authenticated, show the content
  if (user) {
    return <>{children}</>;
  }

  // Show auth required UI for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <Card className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
          <CardContent className={cn(spacing.component.xl, "text-center")}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Dumbbell className="h-8 w-8 text-primary" />
                <h1 className={cn(typography.display.h2, "text-primary font-bold")}>
                  Unlock Your Fitness Journey
                </h1>
              </div>
              <p className={cn(typography.body.large, "text-muted-foreground max-w-3xl mx-auto")}>
                Sign in to access <strong>{featureName}</strong> and start your transformation with AI-powered fitness tools designed for serious athletes and enthusiasts.
              </p>
            </div>

            {/* Feature Being Accessed */}
            <div className="mb-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className={cn(typography.display.h4, "text-foreground")}>
                  Accessing: {featureName}
                </h2>
              </div>
              <p className={cn(typography.body.default, "text-muted-foreground")}>
                {description}
              </p>
            </div>

            {/* Free and Pro features sections remain the same */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="border-2 border-green-200 bg-green-50/50">
                <CardContent className={spacing.component.lg}>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                    <h3 className={cn(typography.display.h5, "text-green-800")}>
                      Free Starter Plan
                    </h3>
                  </div>
                  <div className="text-center mb-4">
                    <div className={cn(typography.display.h3, "text-green-700 font-bold")}>
                      FREE
                    </div>
                    <p className={cn(typography.caption, "text-green-600")}>
                      Your first 3 workout generations
                    </p>
                  </div>
                  <ul className="space-y-3 text-left">
                    {FREE_FEATURES.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className={cn(typography.body.small, "text-green-700")}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardContent className={spacing.component.lg}>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="h-6 w-6 text-amber-600" />
                    <h3 className={cn(typography.display.h5, "text-amber-800")}>
                      Pro Plan
                    </h3>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Most Popular
                    </Badge>
                  </div>
                  <div className="text-center mb-4">
                    <div className={cn(typography.display.h3, "text-amber-700 font-bold")}>
                      $25/mo
                    </div>
                    <p className={cn(typography.caption, "text-amber-600")}>
                      Unlimited access to everything
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-left">
                    {PRO_FEATURES.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-amber-600" />
                        <div>
                          <span className={cn(typography.body.small, "text-amber-700 font-medium")}>
                            {feature.name}
                          </span>
                          <p className={cn(typography.caption, "text-amber-600")}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                onClick={() => setShowAuthDialog(true)}
              >
                <Dumbbell className="h-5 w-5 mr-2" />
                Sign In & Start Your Journey
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className={cn(typography.caption, "text-muted-foreground")}>
                Join thousands of athletes already transforming their training with AI
              </p>
            </div>
          </CardContent>
        </Card>

        <AuthDialog 
          isOpen={showAuthDialog} 
          onOpenChange={setShowAuthDialog}
          onSuccess={() => setShowAuthDialog(false)}
        />
      </div>
    </div>
  );
};
