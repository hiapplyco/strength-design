
import { Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { touch } from "@/utils/responsive";

interface MainCTASectionProps {
  user: any;
  onAuth: () => void;
}

export const MainCTASection = ({ user, onAuth }: MainCTASectionProps) => {
  return (
    <div className="flex items-center justify-center gap-4 py-2 sm:py-3 lg:py-4">
      <Button size="lg" onClick={onAuth} className="bg-primary hover:bg-primary/90 px-8 py-3">
        <Dumbbell className="h-5 w-5 mr-2" />
        {user ? "Go to Generator" : "Start Free - Get 3 Workouts"}
        <ArrowRight className={touch.icon} />
      </Button>
      {!user && (
        <p className="text-sm text-muted-foreground">
          Join thousands of athletes already transforming their training
        </p>
      )}
    </div>
  );
};
