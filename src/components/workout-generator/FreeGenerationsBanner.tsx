
import React from "react";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Sparkles, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { spacing, typography } from "@/lib/design-tokens";
import { useNavigate } from "react-router-dom";

export const FreeGenerationsBanner: React.FC = () => {
  const { workoutUsage, isLoading } = useWorkoutUsage();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const navigate = useNavigate();

  if (isLoading || !workoutUsage) {
    return null;
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 mb-6">
        <CardContent className={spacing.component.md}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-amber-600" />
              <div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 mb-1">
                  Pro Member
                </Badge>
                <p className={cn(typography.body.small, "text-amber-700")}>
                  Unlimited workout generation • All Pro features unlocked
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (workoutUsage.free_workouts_used / 3) * 100;
  const remaining = workoutUsage.free_workouts_remaining;

  return (
    <Card className={cn(
      "mb-6 border-2 transition-all duration-300",
      remaining === 0 
        ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200" 
        : remaining === 1
        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300"
        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
    )}>
      <CardContent className={spacing.component.md}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className={cn(
                "h-6 w-6",
                remaining === 0 ? "text-red-600" : remaining === 1 ? "text-yellow-600" : "text-blue-600"
              )} />
              <div>
                <h3 className={cn(
                  typography.display.h6,
                  remaining === 0 ? "text-red-900" : remaining === 1 ? "text-yellow-900" : "text-blue-900"
                )}>
                  Free Workout Generations
                </h3>
                <p className={cn(
                  typography.body.small,
                  remaining === 0 ? "text-red-700" : remaining === 1 ? "text-yellow-700" : "text-blue-700"
                )}>
                  {remaining > 0 
                    ? `${remaining} of 3 remaining • Make them count!`
                    : "All free generations used"
                  }
                </p>
              </div>
            </div>
            <Badge variant={remaining > 0 ? "default" : "destructive"} className="text-sm px-3 py-1">
              {remaining}/3 Left
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
            <div className="flex justify-between text-xs">
              <span className={cn(
                typography.caption,
                remaining === 0 ? "text-red-600" : remaining === 1 ? "text-yellow-600" : "text-blue-600"
              )}>
                {workoutUsage.free_workouts_used} used
              </span>
              <span className={cn(
                typography.caption,
                remaining === 0 ? "text-red-600" : remaining === 1 ? "text-yellow-600" : "text-blue-600"
              )}>
                3 total
              </span>
            </div>
          </div>

          {/* Call to Action */}
          {remaining === 0 && (
            <div className="pt-3 border-t border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(typography.body.small, "text-red-700 font-medium")}>
                    🚀 Ready for unlimited workouts?
                  </p>
                  <p className={cn(typography.caption, "text-red-600")}>
                    Upgrade to Pro for $25/mo and unlock everything
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {remaining === 1 && (
            <div className="pt-3 border-t border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(typography.body.small, "text-yellow-700 font-medium")}>
                    ⚡ Last free generation!
                  </p>
                  <p className={cn(typography.caption, "text-yellow-600")}>
                    Consider upgrading to Pro for unlimited access
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  size="sm"
                >
                  View Plans
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
