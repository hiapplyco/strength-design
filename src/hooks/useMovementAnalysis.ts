import { useState } from "react";
import { functions, storage } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface AnalysisOptions {
  analysisType?: 'weightlifting' | 'martial-arts' | 'general' | 'injury-prevention';
  customFrameRate?: number;
  startOffset?: string;
  endOffset?: string;
  useTimestamps?: boolean;
  customSystemPrompt?: string;
}

interface BjjAnalyzerRequest {
  videoUrl: string;
  query: string;
  analysisType?: string;
  frameRate?: number;
  startOffset?: string;
  endOffset?: string;
  useTimestamps?: boolean;
  systemPrompt?: string;
}

interface BjjAnalyzerResponse {
  analysis: string;
  metadata?: any;
}

export const useMovementAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<any>(null);
  const { session } = useAuth();

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

    if (!session?.user?.id) {
      toast.error("You must be logged in to analyze videos");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setAnalysisMetadata(null);

    try {
      // Upload video to Firebase Storage
      const timestamp = Date.now();
      const videoFileName = `movement-analysis/${session.user.id}/${timestamp}_${uploadedVideo.name}`;
      const storageRef = ref(storage, videoFileName);

      console.log("Uploading video to Firebase Storage...");
      await uploadBytes(storageRef, uploadedVideo);

      // Get download URL
      const videoUrl = await getDownloadURL(storageRef);
      console.log("Video uploaded successfully, URL:", videoUrl);

      // Prepare request for Cloud Function
      const requestData: BjjAnalyzerRequest = {
        videoUrl,
        query: question,
      };

      // Add analysis options
      if (options.analysisType) {
        requestData.analysisType = options.analysisType;
      }
      if (options.customFrameRate) {
        requestData.frameRate = options.customFrameRate;
      }
      if (options.startOffset) {
        requestData.startOffset = options.startOffset;
      }
      if (options.endOffset) {
        requestData.endOffset = options.endOffset;
      }
      if (options.useTimestamps !== undefined) {
        requestData.useTimestamps = options.useTimestamps;
      }
      if (options.customSystemPrompt) {
        requestData.systemPrompt = options.customSystemPrompt;
      }

      console.log("Calling bjjAnalyzer Cloud Function...");
      console.log("Analysis options:", options);

      // Call the Firebase Cloud Function
      const bjjAnalyzer = httpsCallable<BjjAnalyzerRequest, BjjAnalyzerResponse>(
        functions,
        'bjjAnalyzer'
      );

      const result = await bjjAnalyzer(requestData);

      console.log("Enhanced analysis result:", result.data);

      if (result.data && result.data.analysis) {
        setAnalysis(result.data.analysis);
        setAnalysisMetadata(result.data.metadata || null);
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
    if (!session?.user?.id) {
      toast.error("You must be logged in to save analyses");
      return;
    }

    if (!analysis || !uploadedVideo || !question) {
      toast.error("Cannot save: Missing analysis data");
      return;
    }

    setIsSaving(true);

    try {
      await addDoc(collection(db, `users/${session.user.id}/movement_analyses`), {
        question,
        analysis,
        video_name: uploadedVideo.name,
        metadata: analysisMetadata || null,
        created_at: serverTimestamp()
      });

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
