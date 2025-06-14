
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
    <Card className="w-full p-6 bg-background border-primary">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Edit Your Program</h2>
        <p className="text-foreground/70">
          Customize your workout program content. Use the rich text editor to format your program perfectly.
        </p>
      </div>
      
      <div className="bg-white rounded-lg">
        <Editor 
          content={content}
          onSave={handleSave}
        />
      </div>
    </Card>
  );
}
