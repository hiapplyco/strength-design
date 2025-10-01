
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Copy, 
  Share2,
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareableLink: string;
  content: string;
  videoUrl?: string;
}

export const SocialShareDialog = ({
  open,
  onOpenChange,
  shareableLink,
  content,
  videoUrl
}: SocialShareDialogProps) => {
  const [customMessage, setCustomMessage] = useState("");
  const [platform, setPlatform] = useState<string>("twitter");
  const { toast } = useToast();

  const platforms = [
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "bg-blue-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-pink-500" },
  ];

  const getDefaultMessage = (platformId: string) => {
    const messages = {
      twitter: `🔥 Just created an amazing workout program! Check it out: ${shareableLink} #fitness #workout #training`,
      linkedin: `I've created a comprehensive workout program using AI. Take a look and let me know what you think! ${shareableLink}`,
      facebook: `Hey everyone! I just finished creating this awesome workout program. Perfect for anyone looking to get in shape! ${shareableLink}`,
      instagram: `New workout program just dropped! 💪 Link in bio or check it out here: ${shareableLink} #fitness #workoutplan #training`
    };
    return messages[platformId as keyof typeof messages] || messages.twitter;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const handleShare = (platformId: string) => {
    const message = customMessage || getDefaultMessage(platformId);
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareableLink);
    
    let shareUrl = "";
    
    switch (platformId) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodeURIComponent(customMessage || "Check out this workout program!")}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case "instagram":
        // Instagram doesn't support direct sharing via URL, so we copy the message
        navigator.clipboard.writeText(message);
        toast({
          title: "Message Copied!",
          description: "Message copied to clipboard. Paste it in your Instagram post!",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const selectedPlatform = platforms.find(p => p.id === platform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Program
          </DialogTitle>
          <DialogDescription>
            Share your workout program on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selection */}
          <div>
            <Label>Choose Platform</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {platforms.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      platform === p.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="custom-message">Custom Message</Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={getDefaultMessage(platform)}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the default message for {selectedPlatform?.name}
            </p>
          </div>

          {/* Share Link Preview */}
          <div>
            <Label>Share Link</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={shareableLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleShare(platform)}
              className={`flex-1 ${selectedPlatform?.color} hover:opacity-90`}
            >
              <selectedPlatform.icon className="h-4 w-4 mr-2" />
              Share on {selectedPlatform?.name}
            </Button>
            {videoUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(videoUrl, '_blank')}
              >
                <Video className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
