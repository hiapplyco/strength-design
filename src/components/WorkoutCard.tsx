import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  onStart?: () => void;
}

export function WorkoutCard({ title, description, duration, onStart }: WorkoutCardProps) {
  const { toast } = useToast();

  const handleStart = () => {
    if (onStart) {
      onStart();
    } else {
      toast({
        title: "Coming Soon",
        description: "This feature will be available soon!",
      });
    }
  };

  return (
    <Card className="w-full transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Button variant="outline" size="icon" onClick={handleStart}>
            <Play className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{duration}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}