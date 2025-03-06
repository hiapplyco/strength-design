
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export const useTechniqueAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);

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

  return {
    isLoading,
    uploadedVideo,
    setUploadedVideo,
    question,
    setQuestion,
    analysis,
    setAnalysis,
    handleReset,
    handleSubmitForAnalysis
  };
};
