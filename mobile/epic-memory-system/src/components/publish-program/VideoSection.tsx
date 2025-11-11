
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Upload, Video, FileText, Settings, Share2 } from "lucide-react";
import { CompactRecordingInterface } from "./CompactRecordingInterface";
import { useState } from "react";
import { VoiceGenerationDialog } from "@/components/video-analysis/components/VoiceGenerationDialog";
import { VoiceCloningDialog } from "@/components/video-analysis/components/VoiceCloningDialog";
import { SocialShareDialog } from "@/components/video-analysis/components/SocialShareDialog";

interface VideoSectionProps {
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

export function VideoSection({
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
}: VideoSectionProps) {
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
    <div className="h-full flex flex-col gap-3">
      {/* Condensed Header */}
      <div className="flex-shrink-0">
        <Card className="p-3 bg-background/50 border-primary/50">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Record Your Video
                </h2>
                <p className="text-xs text-foreground/70">
                  Use the teleprompter to read your script while recording.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowVoiceDialog(true)}
                  disabled={!workoutScript}
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Mic className="w-3 h-3" />
                  Voice & Narration
                </Button>
                
                {shareableLink && (
                  <Button
                    onClick={() => setShowSocialShare(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                )}
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('video-upload')?.click()}
                    className="text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Auto-Regen Toggle */}
            <div className="flex items-center justify-between p-2 bg-background/70 rounded-md border border-border/50">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-regen" className="text-xs">Auto-regenerate script</Label>
                <Switch
                  id="auto-regen"
                  checked={autoRegenEnabled}
                  onCheckedChange={onAutoRegenChange}
                />
              </div>
              {isGenerating && (
                <span className="text-xs text-primary animate-pulse">Regenerating...</span>
              )}
            </div>
            
            {selectedFile && (
              <div className="p-2 bg-background/70 rounded-md border border-border/50">
                <span className="text-xs text-foreground/70">
                  Selected: {selectedFile.name}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recording Interface - Takes remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CompactRecordingInterface
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
