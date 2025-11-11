
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      console.log('Extracting text from file:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await supabase.functions.invoke('process-file', {
        body: formData,
      });

      if (response.error) {
        console.error('Error processing file:', response.error);
        throw response.error;
      }

      console.log('File processed successfully:', response.data);
      
      if (!response.data || !response.data.text) {
        throw new Error('No text extracted from file');
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
