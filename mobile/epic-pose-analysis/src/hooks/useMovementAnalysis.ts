
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AnalysisOptions {
  analysisType?: 'weightlifting' | 'martial-arts' | 'general' | 'injury-prevention';
  customFrameRate?: number;
  startOffset?: string;
  endOffset?: string;
  useTimestamps?: boolean;
  customSystemPrompt?: string;
}

export const useMovementAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<any>(null);
  const { user } = useAuth();

  // Reset form
  const handleReset = () => {
    setUploadedVideo(null);
    setQuestion("");
    setAnalysis(null);
    setAnalysisMetadata(null);
  };

  // Enhanced submit for analysis with options
  const handleSubmitForAnalysis = async (options: AnalysisOptions = {}) => {
    if (!uploadedVideo) {
      toast.error("Please upload a video first");
      return;
    }
    
    if (!question.trim()) {
      toast.error("Please enter a question about your technique");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setAnalysisMetadata(null);

    try {
      // Create enhanced form data with analysis options
      const formData = new FormData();
      formData.append('video', uploadedVideo);
      formData.append('query', question);
      
      // Add analysis options
      if (options.analysisType) {
        formData.append('analysisType', options.analysisType);
      }
      if (options.customFrameRate) {
        formData.append('frameRate', options.customFrameRate.toString());
      }
      if (options.startOffset) {
        formData.append('startOffset', options.startOffset);
      }
      if (options.endOffset) {
        formData.append('endOffset', options.endOffset);
      }
      if (options.useTimestamps !== undefined) {
        formData.append('useTimestamps', options.useTimestamps.toString());
      }
      if (options.customSystemPrompt) {
        formData.append('systemPrompt', options.customSystemPrompt);
      }

      console.log("Calling enhanced bjj-analyzer function...");
      console.log("Analysis options:", options);
      
      // Call the enhanced Supabase Edge Function without setting Content-Type header
      // Let the browser handle the multipart boundary automatically
      const { data, error } = await supabase.functions.invoke('bjj-analyzer', {
        body: formData
        // Remove the headers configuration to let browser set Content-Type with boundary
      });

      if (error) {
        throw new Error(error.message || "Analysis failed");
      }

      console.log("Enhanced analysis result:", data);
      
      if (data && data.analysis) {
        setAnalysis(data.analysis);
        setAnalysisMetadata(data.metadata || null);
        toast.success("Enhanced analysis complete!");
      } else {
        throw new Error("No analysis data returned");
      }
    } catch (error: any) {
      console.error("Error during enhanced analysis:", error);
      toast.error(error?.message || "Failed to analyze video. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save analysis to user account with metadata
  const saveAnalysis = async () => {
    if (!user) {
      toast.error("You must be logged in to save analyses");
      return;
    }

    if (!analysis || !uploadedVideo || !question) {
      toast.error("Cannot save: Missing analysis data");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("movement_analyses").insert({
        user_id: user.id,
        question,
        analysis,
        video_name: uploadedVideo.name,
        metadata: analysisMetadata || null
      });

      if (error) {
        throw error;
      }

      toast.success("Analysis saved to your account!");
    } catch (error: any) {
      console.error("Error saving analysis:", error);
      toast.error(error?.message || "Failed to save analysis");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    uploadedVideo,
    setUploadedVideo,
    question,
    setQuestion,
    analysis,
    setAnalysis,
    analysisMetadata,
    handleReset,
    handleSubmitForAnalysis,
    saveAnalysis
  };
};
