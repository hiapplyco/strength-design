
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
    publishDocument,
    autoRegenEnabled,
    setAutoRegenEnabled,
    selectedVoiceId,
    setSelectedVoiceId,
    generateVoiceNarration,
    handleContentChange
  } = usePublishProgram(initialContent, shareableLink);

  const handleDocumentContentChange = (content: string) => {
    handleContentChange(content);
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
    <div className="h-full flex flex-col gap-4">
      {/* Condensed Tabs */}
      <div className="flex-shrink-0">
        <Tabs defaultValue="document" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="document" className="text-sm">Edit Document</TabsTrigger>
            <TabsTrigger value="video" className="text-sm">Record Video</TabsTrigger>
          </TabsList>
          
          {/* Tab Content - Takes remaining height */}
          <div className="mt-3 h-[calc(100vh-220px)]">
            <TabsContent value="document" className="h-full m-0">
              <DocumentSection
                content={workoutScript || initialContent}
                onContentChange={handleDocumentContentChange}
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
                autoRegenEnabled={autoRegenEnabled}
                onAutoRegenChange={setAutoRegenEnabled}
                selectedVoiceId={selectedVoiceId}
                onVoiceChange={setSelectedVoiceId}
                shareableLink={currentShareableLink}
                onGenerateVoiceNarration={generateVoiceNarration}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Fixed Publish Actions at Bottom */}
      <div className="flex-shrink-0 mt-auto">
        <PublishActions
          shareableLink={currentShareableLink}
          content={workoutScript || initialContent}
          onPublish={() => handlePublish(workoutScript || initialContent)}
          isPublishing={isPublishing}
        />
      </div>
    </div>
  );
}
