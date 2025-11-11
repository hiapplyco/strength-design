
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Crown, ArrowRight } from "lucide-react";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

export const WorkoutUsageDisplay = () => {
  const { workoutUsage, isLoading } = useWorkoutUsage();
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { handleSubscription, loadingStates } = useSubscription();

  if (isLoading || !workoutUsage) {
    return null;
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Pro Member
            </Badge>
            <span className="text-sm text-amber-700 font-medium">
              Unlimited workout generation
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (workoutUsage.free_workouts_used / 3) * 100;

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      workoutUsage.needs_subscription 
        ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200" 
        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={cn(
                "h-5 w-5",
                workoutUsage.needs_subscription ? "text-red-600" : "text-blue-600"
              )} />
              <span className={cn(
                "font-medium",
                workoutUsage.needs_subscription ? "text-red-900" : "text-blue-900"
              )}>
                Free Workouts
              </span>
            </div>
            <Badge variant={workoutUsage.free_workouts_remaining > 0 ? "default" : "destructive"}>
              {workoutUsage.free_workouts_remaining} remaining
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
            <p className={cn(
              "text-sm",
              workoutUsage.needs_subscription ? "text-red-700" : "text-blue-700"
            )}>
              {workoutUsage.free_workouts_used} of 3 free workouts used
            </p>
          </div>

          {workoutUsage.needs_subscription && (
            <div className="space-y-3 pt-2 border-t border-red-200">
              <p className="text-sm text-red-600 font-medium text-center">
                ⚠️ You've used all free workouts!
              </p>
              <Button
                onClick={() => handleSubscription('personalized')}
                disabled={loadingStates.personalized}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                size="sm"
              >
                {loadingStates.personalized ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
