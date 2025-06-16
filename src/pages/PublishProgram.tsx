
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
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            size="sm"
            className="h-9 w-9 p-0 rounded-full bg-background/50 hover:bg-background/80"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <LogoHeader className="text-lg font-bold mb-0">
            publish.program
          </LogoHeader>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Create & Share
        </p>
      </div>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen overflow-hidden">
      <div className="h-full flex flex-col">
        <TikTokStylePublishContent 
          initialContent={content}
          documentId={documentId}
          shareableLink={shareableLink}
          onContentChange={handleContentChange}
        />
      </div>
    </StandardPageLayout>
  );
}
