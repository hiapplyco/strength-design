import { useState, useEffect } from "react";
import { Editor } from "@/components/document-editor/Editor";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LogoHeader } from "@/components/ui/logo-header";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, touch, layout } from "@/utils/responsive";

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

  const header = (
    <div className={`${width.narrow} text-center ${spacing.section}`}>
      <LogoHeader className={text.title}>program.edit</LogoHeader>
    </div>
  );

  return (
    <StandardPageLayout header={header} className={spacing.container}>
      <div className={`${width.content} ${spacing.section} ${layout.stack} ${spacing.gap}`}>
        <div className={`bg-card/40 backdrop-blur-sm ${touch.rounded} ${spacing.card}`}>
          <Button 
            onClick={handleBack}
            variant="ghost" 
            className={`${layout.center} ${spacing.gap} text-foreground hover:text-primary mb-4`}
          >
            <ArrowLeft className={touch.icon} /> Back to Generator
          </Button>
          <p className={`${text.subtitle} text-foreground/80 text-center`}>
            Customize your workout program in the editor below. When you're ready, publish your workout and record a video to inspire others!
          </p>
        </div>
        
        <div className={`${width.full} ${layout.noOverflow}`}>
          <Editor content={content} onSave={handleSave} />
        </div>
      </div>
    </StandardPageLayout>
  );
}
