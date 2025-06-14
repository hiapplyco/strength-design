
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-card/20 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleBack}
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <LogoHeader className="text-base sm:text-lg md:text-xl lg:text-2xl mb-0">
                publish.program
              </LogoHeader>
            </div>
            <p className="text-xs text-foreground/70 hidden md:block">
              Edit and publish your workout program
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full container mx-auto px-4 py-4">
          <div className="max-w-7xl mx-auto h-full">
            <PublishProgramContent 
              initialContent={content}
              documentId={documentId}
              shareableLink={shareableLink}
              onContentChange={handleContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
