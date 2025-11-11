
import { useToast } from "@/hooks/use-toast";
import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { useWorkoutConfig } from "@/contexts/WorkoutConfigContext";

interface ProcessWorkoutFileResponse {
  extracted?: any;
  summary?: string;
  configUpdates?: Record<string, any>;
}

/**
 * Custom hook for uploading a file and using Gemini to extract config/notes.
 * On success, updates the config and optionally triggers chat feedback.
 */
export function useGeminiFileUpload({ addMessage }: { addMessage: (msg: any) => void }) {
  const { toast } = useToast();
  const { updateConfig } = useWorkoutConfig();

  const uploadAndProcessFile = async (file: File) => {
    toast({
      title: "Analyzing your document...",
      description: `Parsing "${file.name}" with Gemini.`,
      duration: 3000
    });

    try {
      // Call Firebase Cloud Function to process the workout file
      const processWorkoutFile = httpsCallable<
        { file: File },
        ProcessWorkoutFileResponse
      >(functions, 'processWorkoutFile');

      const result = await processWorkoutFile({ file });
      const data = result.data;

      // data: { extracted, summary, configUpdates }
      if (data?.configUpdates) {
        updateConfig(data.configUpdates);
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've extracted new details from your uploaded file: ${Object.entries(data.configUpdates)
            .map(([k, v]) => `${k}: ${String(v).slice(0, 50)}`)
            .join(', ')}.`,
          timestamp: new Date(),
        });
        toast({
          title: "Config updated from file!",
          description: "Extracted notes have been added.",
          duration: 3500
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data?.summary || "I've analyzed your file, but found no major configuration info.",
          timestamp: new Date(),
        });
      }
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze file';
      toast({
        title: "Failed to analyze file",
        description: errorMessage,
        variant: "destructive"
      });
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I couldn't process your file: ${errorMessage}`,
        timestamp: new Date(),
      });
      throw err;
    }
  };

  return { uploadAndProcessFile };
}
