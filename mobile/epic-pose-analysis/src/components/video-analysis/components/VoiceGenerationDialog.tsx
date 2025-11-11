
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceGeneratingLoading } from "@/components/publish-program/VoiceGeneratingLoading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Mic2 } from "lucide-react";
import { useState } from "react";

interface VoiceGenerationDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
  audioUrl: string | null;
  onGenerateNarration: (voiceId: string) => Promise<void>;
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  autoRegenEnabled: boolean;
  onAutoRegenChange: (enabled: boolean) => void;
}

export const VoiceGenerationDialog = ({
  showDialog,
  onOpenChange,
  isGenerating,
  audioUrl,
  onGenerateNarration,
  selectedVoiceId,
  onVoiceChange,
  autoRegenEnabled,
  onAutoRegenChange,
}: VoiceGenerationDialogProps) => {
  const [showVoiceCloning, setShowVoiceCloning] = useState(false);

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

  const quickVoices = [
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Male)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female)' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Male)' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Female)' }
  ];

  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Mic2 className="h-5 w-5" />
          Voice & Narration Settings
        </DialogTitle>
        <DialogDescription>
          Configure voice settings and generate narration
        </DialogDescription>
        
        {isGenerating ? (
          <div className="py-8">
            <VoiceGeneratingLoading fullScreen={false} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Auto-Regeneration Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Regenerate Script</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically update narration when content changes
                </p>
              </div>
              <Switch
                checked={autoRegenEnabled}
                onCheckedChange={onAutoRegenChange}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label>Select Voice</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickVoices.map((voice) => (
                  <Button
                    key={voice.id}
                    variant={selectedVoiceId === voice.id ? "default" : "outline"}
                    onClick={() => onVoiceChange(voice.id)}
                    className="text-xs"
                  >
                    {voice.name}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowVoiceCloning(true)}
                className="w-full text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                More Voices & Clone Voice
              </Button>
            </div>

            {/* Generate Button */}
            <Button
              onClick={() => onGenerateNarration(selectedVoiceId)}
              disabled={isGenerating}
              className="w-full"
            >
              Generate Narration
            </Button>
            
            {/* Audio Preview & Download */}
            {audioUrl && !isGenerating && (
              <div className="space-y-2">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full"
                >
                  Download Audio
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
