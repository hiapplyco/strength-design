
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "@/components/exercise-search/types";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface DocumentParsingResponse {
  text: string;
  success: boolean;
}

export function useGeminiExerciseExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const parseDocument = async (file: File): Promise<DocumentParsingResponse> => {
    setIsExtracting(true);
    setIsSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await supabase.functions.invoke('process-file', {
        body: formData,
      });

      if (response.error) {
        console.error('Error processing file:', response.error);
        throw response.error;
      }

      setIsSuccess(true);
      toast({
        title: "Success",
        description: "Document processed successfully",
        className: "bg-green-500",
      });

      return {
        text: response.data.text,
        success: true
      };
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
      return {
        text: "",
        success: false
      };
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    parseDocument,
    isExtracting,
    isSuccess
  };
}
