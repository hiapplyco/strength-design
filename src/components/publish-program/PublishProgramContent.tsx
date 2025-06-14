
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentSection } from "./DocumentSection";
import { VideoSection } from "./VideoSection";
import { PublishActions } from "./PublishActions";
import { usePublishProgram } from "./hooks/usePublishProgram";

interface PublishProgramContentProps {
  initialContent: string;
  documentId?: string | null;
  shareableLink?: string | null;
  onContentChange: (content: string) => void;
}

export function PublishProgramContent({
  initialContent,
  documentId,
  shareableLink,
  onContentChange
}: PublishProgramContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  
  const {
    workoutScript,
    isGenerating,
    isReady,
    generateMonologue,
    isPublishing,
    currentShareableLink,
    publishDocument
  } = usePublishProgram(initialContent, shareableLink);

  const handleContentChange = (content: string) => {
    onContentChange(content);
  };

  const handleNarrate = () => {
    if (workoutScript) {
      generateMonologue(workoutScript);
    }
  };

  const handlePublish = async (content: string) => {
    await publishDocument(content);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="document">Edit Document</TabsTrigger>
          <TabsTrigger value="video">Record Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="space-y-6">
          <DocumentSection
            content={workoutScript || initialContent}
            onContentChange={handleContentChange}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
        </TabsContent>
        
        <TabsContent value="video" className="space-y-6">
          <VideoSection
            workoutScript={workoutScript || initialContent}
            teleprompterPosition={teleprompterPosition}
            setTeleprompterPosition={setTeleprompterPosition}
            onNarrate={handleNarrate}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            isGenerating={isGenerating}
          />
        </TabsContent>
      </Tabs>

      <PublishActions
        shareableLink={currentShareableLink}
        content={workoutScript || initialContent}
        onPublish={() => handlePublish(workoutScript || initialContent)}
        isPublishing={isPublishing}
      />
    </div>
  );
}
