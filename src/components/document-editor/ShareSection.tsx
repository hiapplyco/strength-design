import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link2, Copy } from "lucide-react";
import { copyToClipboard } from "./editorUtils";
import { toast } from "@/components/ui/use-toast";

interface ShareSectionProps {
  shareableLink: string;
  handleShare: (platform: 'facebook' | 'twitter' | 'linkedin') => void;
}

export function ShareSection({ shareableLink, handleShare }: ShareSectionProps) {
  if (!shareableLink) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(shareableLink);
    toast({
      title: success ? "Copied!" : "Failed to copy",
      description: success ? "Link copied to clipboard" : "Please copy the link manually",
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <Link2 className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm flex-1 break-all font-mono">{shareableLink}</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-end items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleCopy}
          title="Copy link"
        >
          <Copy className="h-5 w-5" />
        </Button>
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
    </div>
  );
}