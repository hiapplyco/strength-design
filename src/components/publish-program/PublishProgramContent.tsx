
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
    <div className="h-full flex flex-col pt-4">
      <Tabs defaultValue="document" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
          <TabsTrigger value="document">Edit Document</TabsTrigger>
          <TabsTrigger value="video">Record Video</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-0">
          <TabsContent value="document" className="h-full m-0">
            <DocumentSection
              content={workoutScript || initialContent}
              onContentChange={handleContentChange}
            />
          </TabsContent>
          
          <TabsContent value="video" className="h-full m-0">
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
        </div>
        
        <div className="flex-shrink-0 mt-4">
          <PublishActions
            shareableLink={currentShareableLink}
            content={workoutScript || initialContent}
            onPublish={() => handlePublish(workoutScript || initialContent)}
            isPublishing={isPublishing}
          />
        </div>
      </Tabs>
    </div>
  );
}
