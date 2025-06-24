
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  totalWorkouts: number;
  selectedCount: number;
}

export const PageHeader = ({ totalWorkouts, selectedCount }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary">Previous Programs</h1>
        <p className="text-muted-foreground">
          {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} generated
          {selectedCount > 0 && ` • ${selectedCount} selected`}
        </p>
      </div>
      <Button asChild>
        <Link to="/workout-generator">
          <Plus className="h-4 w-4 mr-2" />
          Generate New
        </Link>
      </Button>
    </div>
  );
};
