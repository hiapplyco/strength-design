
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link2, Copy, Mic } from "lucide-react";
import { copyToClipboard } from "./editorUtils";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";

interface ShareSectionProps {
  shareableLink: string;
  handleShare: (platform: 'facebook' | 'twitter' | 'linkedin') => void;
  content?: string;
}

export function ShareSection({ shareableLink, handleShare, content }: ShareSectionProps) {
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  if (!shareableLink) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(shareableLink);
    toast({
      title: success ? "Copied!" : "Failed to copy",
      description: success ? "Link copied to clipboard" : "Please copy the link manually",
      duration: 2000,
    });
  };

  const generateNarration = async (voiceId: string) => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to narrate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Strip HTML tags to get plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: plainText }
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Success",
        description: "Audio narration generated successfully!",
      });
    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Error",
        description: "Failed to generate narration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Link2 className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm flex-1 break-all font-mono">{shareableLink}</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVoiceDialog(true)}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Narrate for me
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('facebook')}
            title="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('twitter')}
            title="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('linkedin')}
            title="Share on LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Choose Voice Type</DialogTitle>
          <DialogDescription>
            Select a voice for your narration
          </DialogDescription>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => generateNarration('EkK5I93UQWFDigLMpZcX')}
                disabled={isGenerating}
              >
                Male Voice
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNarration('kPzsL2i3teMYv0FxEYQ6')}
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
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = audioUrl;
                    a.download = 'narration.mp3';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  Download Audio
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
