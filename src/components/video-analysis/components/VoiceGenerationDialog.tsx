
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";

interface VoiceGenerationDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
  audioUrl: string | null;
  onGenerateNarration: (voiceId: string) => Promise<void>;
}

export const VoiceGenerationDialog = ({
  showDialog,
  onOpenChange,
  isGenerating,
  audioUrl,
  onGenerateNarration,
}: VoiceGenerationDialogProps) => {
  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'narration.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Choose Voice Type</DialogTitle>
        <DialogDescription>
          Select a voice for your narration
        </DialogDescription>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => onGenerateNarration('EkK5I93UQWFDigLMpZcX')}
              disabled={isGenerating}
            >
              Male Voice
            </Button>
            <Button
              variant="outline"
              onClick={() => onGenerateNarration('kPzsL2i3teMYv0FxEYQ6')}
              disabled={isGenerating}
            >
              Female Voice
            </Button>
          </div>
          
          {isGenerating && (
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">Generating narration...</p>
            </div>
          )}

          {audioUrl && !isGenerating && (
            <div className="flex flex-col gap-2">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <Button
                variant="outline"
                onClick={handleDownload}
              >
                Download Audio
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
