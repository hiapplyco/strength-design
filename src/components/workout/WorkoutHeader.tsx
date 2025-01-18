import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, Volume2, Share2 } from "lucide-react";

interface WorkoutHeaderProps {
  title: string;
  isSpeaking: boolean;
  isExporting: boolean;
  onSpeak: () => void;
  onExport: () => void;
}

export function WorkoutHeader({ 
  title, 
  isSpeaking, 
  isExporting, 
  onSpeak, 
  onExport 
}: WorkoutHeaderProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Workout Details',
          text: title,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      console.log('Web Share API not supported');
    }
  };

  return (
    <CardHeader className="relative border-b-[4px] border-primary bg-card rounded-t-[20px]">
      <div className="flex items-center justify-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-primary"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
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
    </CardHeader>
  );
}