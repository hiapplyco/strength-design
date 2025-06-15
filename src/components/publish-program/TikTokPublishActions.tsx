
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TikTokPublishActionsProps {
  shareableLink: string | null;
  content: string;
  onPublish: () => void;
  isPublishing: boolean;
}

export function TikTokPublishActions({
  shareableLink,
  content,
  onPublish,
  isPublishing
}: TikTokPublishActionsProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast({
        title: "✨ Copied!",
        description: "Link copied to clipboard",
      });
    }
  };

  const handleOpenLink = () => {
    if (shareableLink) {
      window.open(shareableLink, '_blank');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {shareableLink ? (
        <Card className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 rounded-2xl">
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                🎉 Published!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your program is live and ready to share
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 rounded-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              
              <Button
                onClick={handleOpenLink}
                className="flex-1 rounded-full bg-primary hover:bg-primary/90"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            </div>
            
            {/* Shareable link display */}
            <div className="p-2 bg-background/50 rounded-xl border border-border/30">
              <span className="font-mono text-xs text-muted-foreground truncate block">
                {shareableLink}
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={onPublish}
          disabled={isPublishing || !content.trim()}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold text-lg"
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Publishing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Publish Program
            </div>
          )}
        </Button>
      )}
    </div>
  );
}
