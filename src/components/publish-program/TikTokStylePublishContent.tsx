
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TikTokDocumentSection } from "./TikTokDocumentSection";
import { TikTokVideoSection } from "./TikTokVideoSection";
import { TikTokPublishActions } from "./TikTokPublishActions";
import { usePublishProgram } from "./hooks/usePublishProgram";
import { Edit3, Video, Share2 } from "lucide-react";

interface TikTokStylePublishContentProps {
  initialContent: string;
  documentId?: string | null;
  shareableLink?: string | null;
  onContentChange: (content: string) => void;
}

export function TikTokStylePublishContent({
  initialContent,
  documentId,
  shareableLink,
  onContentChange
}: TikTokStylePublishContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [activeTab, setActiveTab] = useState("document");
  
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

  const handleGenerateVoiceNarration = async (voiceId: string) => {
    if (workoutScript) {
      return await generateVoiceNarration(workoutScript, voiceId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* TikTok-style tab navigation */}
      <div className="flex-shrink-0 px-4 py-3 bg-background border-b border-border/30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 rounded-2xl p-1">
            <TabsTrigger 
              value="document" 
              className="flex items-center gap-2 text-sm font-medium rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="flex items-center gap-2 text-sm font-medium rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Record</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Content areas with proper viewport handling */}
          <div className="mt-4 h-[calc(100vh-200px)] overflow-hidden">
            <TabsContent value="document" className="h-full m-0">
              <TikTokDocumentSection
                content={workoutScript || initialContent}
                onContentChange={handleDocumentContentChange}
              />
            </TabsContent>
            
            <TabsContent value="video" className="h-full m-0">
              <TikTokVideoSection
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
                onGenerateVoiceNarration={handleGenerateVoiceNarration}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Fixed publish actions at bottom - TikTok style */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border/30 safe-area-bottom">
        <TikTokPublishActions
          shareableLink={currentShareableLink}
          content={workoutScript || initialContent}
          onPublish={() => handlePublish(workoutScript || initialContent)}
          isPublishing={isPublishing}
        />
      </div>
    </div>
  );
}
