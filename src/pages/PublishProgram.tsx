
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LogoHeader } from "@/components/ui/logo-header";
import { TikTokStylePublishContent } from "@/components/publish-program/TikTokStylePublishContent";

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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* TikTok-style sticky header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 safe-area-top">
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
      
      {/* Main content area - takes full remaining viewport */}
      <div className="flex-1 min-h-0">
        <TikTokStylePublishContent 
          initialContent={content}
          documentId={documentId}
          shareableLink={shareableLink}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
