
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScriptGeneration } from "@/components/video-analysis/hooks/useScriptGeneration";
import { useDocumentPublisher } from "@/components/document-editor/hooks/useDocumentPublisher";

export function usePublishProgram(initialContent: string, initialShareableLink?: string | null) {
  const { toast } = useToast();
  const [currentContent, setCurrentContent] = useState(initialContent);
  
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

  return {
    workoutScript: workoutScript || currentContent,
    isGenerating,
    isReady,
    generateMonologue: handleGenerateMonologue,
    isPublishing,
    currentShareableLink: shareableLink || initialShareableLink,
    publishDocument: handlePublishDocument
  };
}
