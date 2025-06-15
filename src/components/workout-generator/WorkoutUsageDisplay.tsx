
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown } from "lucide-react";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export const WorkoutUsageDisplay = () => {
  const { workoutUsage, isLoading } = useWorkoutUsage();
  const { data: subscriptionStatus } = useSubscriptionStatus();

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
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Free Workouts</span>
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
            <p className="text-sm text-blue-700">
              {workoutUsage.free_workouts_used} of 3 free workouts used
            </p>
          </div>

          {workoutUsage.needs_subscription && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ You've used all free workouts. Subscribe for unlimited access!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
