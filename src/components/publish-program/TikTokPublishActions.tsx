
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentPublishingLoading } from "./DocumentPublishingLoading";
import { AnimatePresence, motion } from "framer-motion";

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
    <AnimatePresence mode="wait">
      {isPublishing ? (
        <motion.div
          key="publishing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <DocumentPublishingLoading fullScreen={false} className="py-8" />
        </motion.div>
      ) : (
        <motion.div
          key="actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-2 sm:p-3 bg-card/80 backdrop-blur-sm border-primary/50 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${shareableLink ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {shareableLink ? 'Program Published' : 'Publish Your Program'}
                  </h3>
                  <p className="text-xs text-foreground/70 truncate">
                    {shareableLink 
                      ? 'Your program is live and ready to share' 
                      : 'Share your workout program with the world'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {shareableLink ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 text-xs rounded-full h-7 sm:h-8 min-w-0"
                    >
                      <Copy className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenLink}
                      className="flex items-center gap-1 text-xs rounded-full h-7 sm:h-8 min-w-0"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onPublish}
                    disabled={!content.trim()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 sm:gap-2 text-xs rounded-full h-7 sm:h-8 min-w-0"
                  >
                    <Share2 className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Publish Program</span>
                    <span className="sm:hidden">Publish</span>
                  </Button>
                )}
              </div>
            </div>

            {shareableLink && (
              <div className="mt-2 sm:mt-3 p-2 bg-background/50 rounded-lg border border-border/50 w-full min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 text-xs w-full min-w-0">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="font-mono text-foreground/80 truncate flex-1 min-w-0">
                    {shareableLink}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
