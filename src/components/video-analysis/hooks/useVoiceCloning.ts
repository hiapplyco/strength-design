
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VoiceProfile {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
}

export const useVoiceCloning = () => {
  const [isCloning, setIsCloning] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceProfile[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const { toast } = useToast();

  const cloneVoice = async (audioFile: File, voiceName: string, voiceDescription?: string) => {
    setIsCloning(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('name', voiceName);
      if (voiceDescription) {
        formData.append('description', voiceDescription);
      }

      const { data, error } = await supabase.functions.invoke('clone-voice', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voice cloned successfully!",
      });

      // Refresh available voices
      await loadAvailableVoices();
      
      return data.voice_id;
    } catch (error) {
      console.error('Error cloning voice:', error);
      toast({
        title: "Error",
        description: "Failed to clone voice. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCloning(false);
    }
  };

  const loadAvailableVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-voices');
      
      if (error) throw error;
      
      setAvailableVoices(data.voices || []);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast({
        title: "Error",
        description: "Failed to load available voices.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const generateSpeechWithVoice = async (text: string, voiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voice_id: voiceId,
          model_id: "eleven_multilingual_v2"
        }
      });

      if (error) throw error;

      return data.audioContent;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  };

  return {
    isCloning,
    availableVoices,
    isLoadingVoices,
    cloneVoice,
    loadAvailableVoices,
    generateSpeechWithVoice
  };
};
