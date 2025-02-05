import { useState, useEffect } from "react";
import { Editor } from "@/components/document-editor/Editor";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("/lovable-uploads/87fa814a-1a62-45af-b6cc-70b57bfc5a1e.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: '0.35',
          filter: 'brightness(0.5)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto pt-32 pb-24 px-4">
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            className="flex items-center gap-2 text-white hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Generator
          </Button>
          <h1 className="text-4xl font-bold text-center font-heading">Document Editor</h1>
        </div>
        <div className="max-w-4xl mx-auto">
          <Editor content={content} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}