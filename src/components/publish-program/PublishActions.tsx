
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, ExternalLink, CheckCircle } from "lucide-react";
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
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${shareableLink ? 'bg-green-500' : 'bg-gray-400'}`} />
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {shareableLink ? 'Program Published' : 'Publish Your Program'}
            </h3>
            <p className="text-sm text-foreground/70">
              {shareableLink 
                ? 'Your program is live and ready to share' 
                : 'Share your workout program with the world'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {shareableLink ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </Button>
            </>
          ) : (
            <Button
              onClick={onPublish}
              disabled={isPublishing || !content.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {isPublishing ? "Publishing..." : "Publish Program"}
            </Button>
          )}
        </div>
      </div>

      {shareableLink && (
        <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="font-mono text-foreground/80 truncate flex-1">
              {shareableLink}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
