
import { Editor } from "@/components/document-editor/Editor";
import { Card } from "@/components/ui/card";

interface DocumentSectionProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function DocumentSection({
  content,
  onContentChange
}: DocumentSectionProps) {
  const handleSave = (newContent: string) => {
    onContentChange(newContent);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Condensed Header */}
      <div className="flex-shrink-0">
        <Card className="p-3 bg-background/50 border-primary/50">
          <h2 className="text-lg font-bold text-foreground mb-1">Edit Your Program</h2>
          <p className="text-xs text-foreground/70">
            Customize your workout program content using the rich text editor below.
          </p>
        </Card>
      </div>
      
      {/* Editor Container - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Card className="h-full p-0 bg-background border-primary/50">
          <div className="h-full relative overflow-hidden">
            <Editor 
              content={content}
              onSave={handleSave}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
