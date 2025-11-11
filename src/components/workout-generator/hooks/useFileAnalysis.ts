import { useState } from "react";
import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

interface ProcessFileResponse {
  text: string;
}

export const useFileAnalysis = () => {
  const [prescribedExercises, setPrescribedExercises] = useState<string>("");
  const [injuries, setInjuries] = useState<string>("");
  const [isAnalyzingPrescribed, setIsAnalyzingPrescribed] = useState(false);
  const [isAnalyzingInjuries, setIsAnalyzingInjuries] = useState(false);
  const { toast } = useToast();

  const handlePrescribedFileSelect = async (file: File) => {
    try {
      setIsAnalyzingPrescribed(true);

      // Call Firebase Cloud Function to process the file
      const processFile = httpsCallable<
        { file: File },
        ProcessFileResponse
      >(functions, 'processFile');

      const result = await processFile({ file });

      if (!result.data) {
        throw new Error('No response data from Cloud Function');
      }

      const { text } = result.data;
      setPrescribedExercises(text);

      toast({
        title: "Success",
        description: "Exercise program processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAnalyzingPrescribed(false);
    }
  };

  const handleInjuriesFileSelect = async (file: File) => {
    try {
      setIsAnalyzingInjuries(true);

      // Call Firebase Cloud Function to process the file
      const processFile = httpsCallable<
        { file: File },
        ProcessFileResponse
      >(functions, 'processFile');

      const result = await processFile({ file });

      if (!result.data) {
        throw new Error('No response data from Cloud Function');
      }

      const { text } = result.data;
      setInjuries(text);

      toast({
        title: "Success",
        description: "Medical document processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAnalyzingInjuries(false);
    }
  };

  return {
    prescribedExercises,
    setPrescribedExercises,
    injuries,
    setInjuries,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect
  };
};