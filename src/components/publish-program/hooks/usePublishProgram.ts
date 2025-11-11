import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useDocumentPublisher } from "@/components/document-editor/hooks/useDocumentPublisher";

export function usePublishProgram(initialContent: string, initialShareableLink?: string | null) {
  const { toast } = useToast();
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("TX3LPaxmHKxFdv7VOQHJ"); // Default to Liam voice

  const {
    shareableLink,
    isPublishing,
    publishDocument
  } = useDocumentPublisher();

  // Initialize with existing content
  useEffect(() => {
    if (initialContent) {
      setCurrentContent(initialContent);
    }
  }, [initialContent]);

  const handlePublishDocument = async (content: string) => {
    try {
      await publishDocument(content);
    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Error",
        description: "Failed to publish document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
  };

  const generateVoiceNarration = async (text: string, voiceId: string) => {
    try {
      const textToSpeech = httpsCallable(functions, 'textToSpeech');
      const result = await textToSpeech({
        text,
        voice_id: voiceId,
        model_id: "eleven_multilingual_v2"
      });

      const data = result.data as any;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );

      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating voice narration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate voice narration. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    workoutScript: currentContent,
    isGenerating: false,
    isReady: true,
    isPublishing,
    currentShareableLink: shareableLink || initialShareableLink,
    publishDocument: handlePublishDocument,
    selectedVoiceId,
    setSelectedVoiceId,
    generateVoiceNarration,
    handleContentChange
  };
}
