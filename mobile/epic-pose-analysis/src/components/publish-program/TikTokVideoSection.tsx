
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Upload, Video, Settings, Sparkles } from "lucide-react";
import { TikTokRecordingInterface } from "./TikTokRecordingInterface";
import { useState } from "react";
import { VoiceGenerationDialog } from "@/components/video-analysis/components/VoiceGenerationDialog";
import { VoiceCloningDialog } from "@/components/video-analysis/components/VoiceCloningDialog";
import { SocialShareDialog } from "@/components/video-analysis/components/SocialShareDialog";

interface TikTokVideoSectionProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
  onNarrate: () => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  isGenerating: boolean;
  autoRegenEnabled: boolean;
  onAutoRegenChange: (enabled: boolean) => void;
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  shareableLink?: string;
  onGenerateVoiceNarration?: (voiceId: string) => Promise<string | undefined>;
}

export function TikTokVideoSection({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
  onNarrate,
  onFileSelect,
  selectedFile,
  isGenerating,
  autoRegenEnabled,
  onAutoRegenChange,
  selectedVoiceId,
  onVoiceChange,
  shareableLink,
  onGenerateVoiceNarration
}: TikTokVideoSectionProps) {
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [showVoiceCloning, setShowVoiceCloning] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleGenerateNarration = async (voiceId: string) => {
    try {
      if (onGenerateVoiceNarration) {
        const url = await onGenerateVoiceNarration(voiceId);
        if (url) {
          setAudioUrl(url);
        }
      }
    } catch (error) {
      console.error('Failed to generate narration:', error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2 sm:gap-3 overflow-hidden">
      {/* TikTok-style controls header */}
      <div className="flex-shrink-0 w-full">
        <Card className="p-2 sm:p-4 bg-muted/30 border-border/50 rounded-xl sm:rounded-2xl w-full overflow-hidden">
          <div className="flex flex-col gap-3 sm:gap-4 w-full min-w-0">
            {/* Primary action buttons */}
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center w-full">
              <Button
                onClick={() => setShowVoiceDialog(true)}
                disabled={!workoutScript}
                size="sm"
                className="flex items-center gap-1 sm:gap-2 rounded-full bg-primary hover:bg-primary/90 text-xs sm:text-sm min-w-0 flex-shrink-0"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">AI Voice</span>
                <span className="sm:hidden">AI</span>
              </Button>
              
              <Button
                onClick={() => setShowVoiceDialog(true)}
                disabled={!workoutScript}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm min-w-0 flex-shrink-0"
              >
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Narrate</span>
                <span className="sm:hidden">Mic</span>
              </Button>
              
              <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0">
                <input
                  type="file"
                  id="tiktok-video-upload"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('tiktok-video-upload')?.click()}
                  className="rounded-full text-xs sm:text-sm min-w-0 flex-shrink-0"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Upload</span>
                  <span className="sm:hidden">Up</span>
                </Button>
              </div>
            </div>
            
            {/* Auto-regen toggle */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded-lg sm:rounded-xl border border-border/30 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Label htmlFor="tiktok-auto-regen" className="text-xs sm:text-sm truncate">Smart regenerate</Label>
                <Switch
                  id="tiktok-auto-regen"
                  checked={autoRegenEnabled}
                  onCheckedChange={onAutoRegenChange}
                  className="flex-shrink-0"
                />
              </div>
              {isGenerating && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0"></div>
                  <span className="text-xs text-primary hidden sm:inline">Generating...</span>
                </div>
              )}
            </div>
            
            {selectedFile && (
              <div className="p-2 sm:p-3 bg-background/50 rounded-lg sm:rounded-xl border border-border/30 w-full min-w-0">
                <span className="text-xs sm:text-sm text-muted-foreground truncate block">
                  📹 {selectedFile.name}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main recording interface - takes remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden w-full">
        <TikTokRecordingInterface
          workoutScript={workoutScript}
          teleprompterPosition={teleprompterPosition}
          setTeleprompterPosition={setTeleprompterPosition}
        />
      </div>

      {/* Dialogs */}
      <VoiceGenerationDialog
        showDialog={showVoiceDialog}
        onOpenChange={setShowVoiceDialog}
        isGenerating={isGenerating}
        audioUrl={audioUrl}
        onGenerateNarration={handleGenerateNarration}
        selectedVoiceId={selectedVoiceId}
        onVoiceChange={onVoiceChange}
        autoRegenEnabled={autoRegenEnabled}
        onAutoRegenChange={onAutoRegenChange}
      />

      <VoiceCloningDialog
        open={showVoiceCloning}
        onOpenChange={setShowVoiceCloning}
        onVoiceSelect={onVoiceChange}
      />

      {shareableLink && (
        <SocialShareDialog
          open={showSocialShare}
          onOpenChange={setShowSocialShare}
          shareableLink={shareableLink}
          content={workoutScript}
        />
      )}
    </div>
  );
}
