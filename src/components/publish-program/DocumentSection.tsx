
import { Editor } from "@/components/document-editor/Editor";
import { Card } from "@/components/ui/card";

interface DocumentSectionProps {
  content: string;
  onContentChange: (content: string) => void;
  onPublish: (content: string) => void;
  isPublishing: boolean;
}

export function DocumentSection({
  content,
  onContentChange,
  onPublish,
  isPublishing
}: DocumentSectionProps) {
  const handleSave = (newContent: string) => {
    onContentChange(newContent);
  };

  return (
    <Card className="h-full p-4 bg-background border-primary flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-xl font-bold text-foreground mb-2">Edit Your Program</h2>
        <p className="text-sm text-foreground/70">
          Customize your workout program content. Use the rich text editor to format your program perfectly.
        </p>
      </div>
      
      <div className="flex-1 bg-white rounded-lg overflow-hidden">
        <Editor 
          content={content}
          onSave={handleSave}
        />
      </div>
    </Card>
  );
}
