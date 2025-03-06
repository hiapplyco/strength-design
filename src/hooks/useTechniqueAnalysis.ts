
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useTechniqueAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { user } = useAuth();

  // Create Supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Reset form
  const handleReset = () => {
    setUploadedVideo(null);
    setQuestion("");
    setAnalysis(null);
  };

  // Submit for analysis
  const handleSubmitForAnalysis = async () => {
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

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', uploadedVideo);
      formData.append('query', question);

      console.log("Calling bjj-analyzer function...");
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('bjj-analyzer', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (error) {
        throw new Error(error.message || "Analysis failed");
      }

      console.log("Analysis result:", data);
      
      if (data && data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Analysis complete!");
      } else {
        throw new Error("No analysis data returned");
      }
    } catch (error: any) {
      console.error("Error during analysis:", error);
      toast.error(error?.message || "Failed to analyze video. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save analysis to user account
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
      const { error } = await supabase.from("technique_analyses").insert({
        user_id: user.id,
        question,
        analysis,
        video_name: uploadedVideo.name
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
    handleReset,
    handleSubmitForAnalysis,
    saveAnalysis
  };
};
