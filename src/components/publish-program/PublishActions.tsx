
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
    <Card className="p-3 bg-card/80 backdrop-blur-sm border-primary/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${shareableLink ? 'bg-green-500' : 'bg-gray-400'}`} />
          <div>
            <h3 className="text-base font-bold text-foreground">
              {shareableLink ? 'Program Published' : 'Publish Your Program'}
            </h3>
            <p className="text-xs text-foreground/70">
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
                className="flex items-center gap-1 text-xs"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                className="flex items-center gap-1 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </Button>
            </>
          ) : (
            <Button
              onClick={onPublish}
              disabled={isPublishing || !content.trim()}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-xs"
            >
              <Share2 className="w-3 h-3" />
              {isPublishing ? "Publishing..." : "Publish Program"}
            </Button>
          )}
        </div>
      </div>

      {shareableLink && (
        <div className="mt-3 p-2 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
            <span className="font-mono text-foreground/80 truncate flex-1">
              {shareableLink}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
