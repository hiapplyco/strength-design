import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link2 } from "lucide-react";

interface ShareSectionProps {
  shareableLink: string;
  handleShare: (platform: 'facebook' | 'twitter' | 'linkedin') => void;
}

export function ShareSection({ shareableLink, handleShare }: ShareSectionProps) {
  if (!shareableLink) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <Link2 className="h-4 w-4" />
        <span className="text-sm flex-1 break-all">{shareableLink}</span>
      </div>
      <div className="flex gap-2 justify-end">
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