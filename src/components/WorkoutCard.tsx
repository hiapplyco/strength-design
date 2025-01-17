import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface WorkoutSectionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}

const WorkoutSection = ({ label, value, onChange, minHeight = "80px" }: WorkoutSectionProps) => (
  <div className="space-y-2 rounded bg-card p-4 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <label className="text-sm font-bold uppercase tracking-tight text-secondary">
      {label}
    </label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[80px] resize-y bg-background font-medium text-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      style={{ minHeight }}
    />
  </div>
);

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: string;
  onStart?: () => void;
}

export function WorkoutCard({ title, description, duration, onStart }: WorkoutCardProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStart = async () => {
    if (onStart) {
      setIsGenerating(true);
      try {
        await onStart();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start workout",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      toast({
        title: "Coming Soon",
        description: "This feature will be available soon!",
      });
    }
  };

  return (
    <Card className="relative w-full animate-fade-in border-[4px] border-primary bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="relative border-b-[4px] border-primary bg-card">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-collegiate uppercase tracking-tight">{title}</CardTitle>
            <CardDescription>{duration}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleStart} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <WorkoutSection
          label="Description"
          value={description}
          onChange={() => {}}
          minHeight="60px"
        />
        <Button 
          onClick={handleStart} 
          disabled={isGenerating}
          className="w-full border-2 border-primary bg-card font-bold uppercase tracking-tight text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate Workout'}
        </Button>
      </CardContent>
    </Card>
  );
}