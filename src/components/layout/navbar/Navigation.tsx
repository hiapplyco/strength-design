import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dumbbell, FileText } from "lucide-react";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <Button asChild variant="ghost" className="text-sm font-medium transition-colors hover:text-primary">
        <Link to="/workout-generator" className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Generate Workout
        </Link>
      </Button>
      <Button asChild variant="ghost" className="text-sm font-medium transition-colors hover:text-primary">
        <Link to="/generated-workouts" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          My Workouts
        </Link>
      </Button>
    </nav>
  );
}