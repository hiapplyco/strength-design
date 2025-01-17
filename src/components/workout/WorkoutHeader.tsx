import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, Volume2 } from "lucide-react";

interface WorkoutHeaderProps {
  title: string;
  duration: string;
  isSpeaking: boolean;
  isExporting: boolean;
  onSpeak: () => void;
  onExport: () => void;
}

export function WorkoutHeader({ 
  title, 
  duration, 
  isSpeaking, 
  isExporting, 
  onSpeak, 
  onExport 
}: WorkoutHeaderProps) {
  return (
    <CardHeader className="relative border-b-[4px] border-primary bg-card rounded-t-[20px]">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="font-collegiate uppercase tracking-tight text-primary">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">{duration}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-primary"
            onClick={onSpeak}
            disabled={isSpeaking}
          >
            {isSpeaking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-primary"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}