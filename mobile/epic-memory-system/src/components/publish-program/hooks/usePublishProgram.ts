
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScriptGeneration } from "@/components/video-analysis/hooks/useScriptGeneration";
import { useDocumentPublisher } from "@/components/document-editor/hooks/useDocumentPublisher";
import { useAutoRegeneration } from "@/components/video-analysis/hooks/useAutoRegeneration";

export function usePublishProgram(initialContent: string, initialShareableLink?: string | null) {
  const { toast } = useToast();
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [autoRegenEnabled, setAutoRegenEnabled] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("TX3LPaxmHKxFdv7VOQHJ"); // Default to Liam voice
  
  const {
    workoutScript,
    isGenerating,
    isReady,
    generateMonologue
  } = useScriptGeneration();

  const {
    shareableLink,
    isPublishing,
    publishDocument
  } = useDocumentPublisher();

  // Auto-regeneration setup
  const { isRegenerating } = useAutoRegeneration(currentContent, {
    enabled: autoRegenEnabled,
    delayMs: 2000, // 2 second delay
    onRegenerate: async (content: string) => {
      try {
        await handleGenerateMonologue(content);
      } catch (error) {
        console.error('Auto-regeneration failed:', error);
        throw error;
      }
    }
  });

  // Initialize with existing content
  useEffect(() => {
    if (initialContent && !workoutScript) {
      setCurrentContent(initialContent);
    }
  }, [initialContent, workoutScript]);

  const handleGenerateMonologue = async (content: string) => {
    try {
      await generateMonologue(content);
    } catch (error) {
      console.error('Error generating monologue:', error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voice_id: voiceId,
          model_id: "eleven_multilingual_v2"
        }
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating voice narration:', error);
      toast({
        title: "Error",
        description: "Failed to generate voice narration. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    workoutScript: workoutScript || currentContent,
    isGenerating: isGenerating || isRegenerating,
    isReady,
    generateMonologue: handleGenerateMonologue,
    isPublishing,
    currentShareableLink: shareableLink || initialShareableLink,
    publishDocument: handlePublishDocument,
    autoRegenEnabled,
    setAutoRegenEnabled,
    selectedVoiceId,
    setSelectedVoiceId,
    generateVoiceNarration,
    handleContentChange
  };
}
