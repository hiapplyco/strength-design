
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LogoHeader } from "@/components/ui/logo-header";
import { PublishProgramContent } from "@/components/publish-program/PublishProgramContent";

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
    <div className="h-screen bg-background flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 container mx-auto pt-6 px-4">
        <div className="max-w-6xl mx-auto bg-card/40 backdrop-blur-sm rounded-xl p-4">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            className="flex items-center gap-2 text-foreground hover:text-primary mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Generator
          </Button>
          <div className="text-center mb-3">
            <LogoHeader>publish.program</LogoHeader>
          </div>
          <p className="text-base text-foreground/80 text-center">
            Edit your workout program and record your video content. Publish to share with your audience!
          </p>
        </div>
      </div>
      
      {/* Main Content - Flexible with proper overflow */}
      <div className="flex-1 min-h-0 container mx-auto px-4 pb-4">
        <div className="max-w-6xl mx-auto h-full">
          <PublishProgramContent 
            initialContent={content}
            documentId={documentId}
            shareableLink={shareableLink}
            onContentChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  );
}
