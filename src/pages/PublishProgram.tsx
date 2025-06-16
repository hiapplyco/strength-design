
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LogoHeader } from "@/components/ui/logo-header";
import { TikTokStylePublishContent } from "@/components/publish-program/TikTokStylePublishContent";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

export default function PublishProgram() {
  const [content, setContent] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.content) {
      setContent(location.state.content);
    }
    if (location.state?.documentId) {
      setDocumentId(location.state.documentId);
    }
    if (location.state?.shareableLink) {
      setShareableLink(location.state.shareableLink);
    }
    if (location.state?.workoutScript) {
      setContent(location.state.workoutScript);
    }
  }, [location.state]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleBack = () => {
    navigate('/workout-generator');
  };

  const header = (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between w-full max-w-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full bg-background/50 hover:bg-background/80 flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <LogoHeader className="text-base sm:text-lg font-bold mb-0 truncate min-w-0">
            publish.program
          </LogoHeader>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
          Create & Share
        </p>
      </div>
    </div>
  );

  return (
    <StandardPageLayout header={header}>
      <TikTokStylePublishContent 
        initialContent={content}
        documentId={documentId}
        shareableLink={shareableLink}
        onContentChange={handleContentChange}
      />
    </StandardPageLayout>
  );
}
