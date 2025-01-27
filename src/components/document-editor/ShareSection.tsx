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
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <Link2 className="h-4 w-4" />
        <span className="text-sm flex-1 break-all">{shareableLink}</span>
      </div>
      <div className="flex gap-2 justify-end items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleCopy}
          title="Copy link"
        >
          <Copy className="h-6 w-6" />
        </Button>
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
  );
}