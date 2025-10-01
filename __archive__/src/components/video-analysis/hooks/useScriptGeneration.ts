import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useScriptGeneration = () => {
  const [workoutScript, setWorkoutScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  const generateMonologue = async (content: string) => {
    try {
      setIsGenerating(true);
      console.log('Generating monologue for content:', content);
      
      const { data, error } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          workoutPlan: content
        }
      });

      if (error) {
        console.error('Error generating monologue:', error);
        toast({
          title: "Error",
          description: "Failed to generate the script. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      if (data?.monologue) {
        console.log('Generated monologue:', data.monologue);
        const formattedMonologue = data.monologue
          .replace(/<[^>]*>/g, '')  // Remove any HTML tags
          .replace(/\\n/g, '\n')    // Replace literal \n with actual newlines
          .trim();
        
        setWorkoutScript(formattedMonologue);
        setIsReady(true);
        toast({
          title: "Success",
          description: "Your influencer script is ready!",
        });
        return;
      }
    } catch (error) {
      console.error('Error in generateMonologue:', error);
      setWorkoutScript(content);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    workoutScript,
    isGenerating,
    isReady,
    generateMonologue
  };
};