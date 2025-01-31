import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useVideoProcessing = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a video file to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a video smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const compressVideo = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return {
    selectedFile,
    isAnalyzing,
    setIsAnalyzing,
    handleFileSelect,
    compressVideo,
  };
};