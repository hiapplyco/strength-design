
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";
import { useState, useRef } from "react";
import { useVoiceCloning, VoiceProfile } from "../hooks/useVoiceCloning";
import { Upload, Mic, Play } from "lucide-react";

interface VoiceCloningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceSelect: (voiceId: string) => void;
}

export const VoiceCloningDialog = ({
  open,
  onOpenChange,
  onVoiceSelect,
}: VoiceCloningDialogProps) => {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"existing" | "clone">("existing");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isCloning,
    availableVoices,
    isLoadingVoices,
    cloneVoice,
    loadAvailableVoices,
  } = useVoiceCloning();

  useState(() => {
    if (open) {
      loadAvailableVoices();
    }
  }, [open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCloneVoice = async () => {
    if (!selectedFile || !voiceName.trim()) return;
    
    try {
      const voiceId = await cloneVoice(selectedFile, voiceName, voiceDescription);
      onVoiceSelect(voiceId);
      onOpenChange(false);
      
      // Reset form
      setVoiceName("");
      setVoiceDescription("");
      setSelectedFile(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSelectExistingVoice = (voiceId: string) => {
    onVoiceSelect(voiceId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Selection</DialogTitle>
          <DialogDescription>
            Choose an existing voice or clone your own
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab("existing")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "existing"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Existing Voices
          </button>
          <button
            onClick={() => setActiveTab("clone")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "clone"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            Clone Voice
          </button>
        </div>

        {activeTab === "existing" && (
          <div className="space-y-3">
            {isLoadingVoices ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleSelectExistingVoice(voice.voice_id)}
                  >
                    <div>
                      <p className="font-medium">{voice.name}</p>
                      {voice.description && (
                        <p className="text-sm text-muted-foreground">{voice.description}</p>
                      )}
                    </div>
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "clone" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice-name">Voice Name</Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Enter a name for your voice"
              />
            </div>

            <div>
              <Label htmlFor="voice-description">Description (Optional)</Label>
              <Textarea
                id="voice-description"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="Describe the voice characteristics"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="audio-file">Audio Sample</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="audio-file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Select Audio File"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a clear audio sample (at least 30 seconds recommended)
                </p>
              </div>
            </div>

            <Button
              onClick={handleCloneVoice}
              disabled={!selectedFile || !voiceName.trim() || isCloning}
              className="w-full"
            >
              {isCloning ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Cloning Voice...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Clone Voice
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
