
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <Card className="p-4 bg-background/50 border-primary/50">
          <h2 className="text-xl font-bold text-foreground mb-2">Edit Your Program</h2>
          <p className="text-sm text-foreground/70">
            Customize your workout program content using the rich text editor below.
          </p>
        </Card>
      </div>
      
      {/* Editor Container */}
      <div className="flex-1 min-h-0">
        <Card className="h-full p-0 bg-background border-primary/50 overflow-hidden">
          <div className="h-full relative">
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
