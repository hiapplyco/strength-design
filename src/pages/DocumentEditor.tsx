import { useState, useEffect } from "react";
import { Editor } from "@/components/document-editor/Editor";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LogoHeader } from "@/components/ui/logo-header";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

export default function DocumentEditor() {
  const [content, setContent] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.content) {
      setContent(location.state.content);
    }
  }, [location.state]);

  const handleSave = async (newContent: string) => {
    setContent(newContent);
    // Here you can implement the save functionality
    // For example, saving to Supabase or local storage
  };

  const handleBack = () => {
    navigate('/workout-generator');
  };

  return (
    <StandardPageLayout
      header={
        <div className="text-center mb-6">
          <LogoHeader>program.edit</LogoHeader>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto bg-card/40 backdrop-blur-sm rounded-xl p-8 mb-12 mt-6">
        <Button 
          onClick={handleBack}
          variant="ghost" 
          className="flex items-center gap-2 text-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Generator
        </Button>
        <p className="text-xl text-foreground/80 text-center">
          Customize your workout program in the editor below. When you're ready, publish your workout and record a video to inspire others!
        </p>
      </div>
      <div className="max-w-4xl mx-auto">
        <Editor content={content} onSave={handleSave} />
      </div>
    </StandardPageLayout>
  );
}
