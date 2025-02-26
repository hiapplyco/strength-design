
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Share2 } from "lucide-react";

interface ShareDialogProps {
  isSharing: boolean;
  sharedLink: string | null;
  onShare: () => void;
  workoutScript: string;
}

export const ShareDialog = ({ isSharing, sharedLink, onShare, workoutScript }: ShareDialogProps) => {
  const handleShare = async () => {
    if (!workoutScript) {
      toast({
        title: "Error",
        description: "No content to share",
        variant: "destructive",
      });
      return;
    }
    await onShare();
  };

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleShare}
        disabled={isSharing || !workoutScript}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {isSharing ? 'Sharing...' : 'Share Content'}
      </Button>

      {sharedLink && (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm text-white">Share this link:</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={sharedLink}
              readOnly
              className="flex-1 bg-black/50 text-white px-3 py-1 rounded border border-gray-700"
            />
            <Button
              variant="outline"
              onClick={handleCopyLink}
            >
              Copy
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
