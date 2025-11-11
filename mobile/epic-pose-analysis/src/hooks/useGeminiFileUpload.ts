
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkoutConfig } from "@/contexts/WorkoutConfigContext";

/**
 * Custom hook for uploading a file and using Gemini to extract config/notes.
 * On success, updates the config and optionally triggers chat feedback.
 */
export function useGeminiFileUpload({ addMessage }: { addMessage: (msg: any) => void }) {
  const { toast } = useToast();
  const { updateConfig } = useWorkoutConfig();

  const uploadAndProcessFile = async (file: File) => {
    toast({ title: "Analyzing your document...", description: `Parsing "${file.name}" with Gemini.`, duration: 3000 });
    try {
      const { data, error } = await supabase.functions.invoke('process-workout-file', {
        body: { file },
      });
      if (error) throw error;

      // data: { extracted, summary, configUpdates }
      if (data?.configUpdates) {
        updateConfig(data.configUpdates);
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've extracted new details from your uploaded file: ${Object.entries(data.configUpdates).map(([k, v]) => `${k}: ${String(v).slice(0,50)}`).join(', ')}.`,
          timestamp: new Date(),
        });
        toast({ title: "Config updated from file!", description: "Extracted notes have been added.", duration: 3500 });
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
      toast({ title: "Failed to analyze file", description: err.message, variant: "destructive" });
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I couldn't process your file: ${err.message}`,
        timestamp: new Date(),
      });
    }
  };

  return { uploadAndProcessFile };
}
