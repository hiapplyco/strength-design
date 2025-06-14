
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublishActionsProps {
  shareableLink: string | null;
  content: string;
  onPublish: () => void;
  isPublishing: boolean;
}

export function PublishActions({
  shareableLink,
  content,
  onPublish,
  isPublishing
}: PublishActionsProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    }
  };

  const handleOpenLink = () => {
    if (shareableLink) {
      window.open(shareableLink, '_blank');
    }
  };

  return (
    <Card className="p-4 bg-card/50 border-primary">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-foreground">Publish Your Program</h3>
            <p className="text-sm text-foreground/70">
              Share your workout program with the world
            </p>
          </div>
          
          <Button
            onClick={onPublish}
            disabled={isPublishing || !content.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPublishing ? "Publishing..." : "Publish Program"}
          </Button>
        </div>

        {shareableLink && (
          <div className="flex items-center gap-4 p-3 bg-background/50 rounded-lg border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground/70 mb-1">Shareable Link:</p>
              <p className="text-sm font-mono text-foreground truncate">
                {shareableLink}
              </p>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
