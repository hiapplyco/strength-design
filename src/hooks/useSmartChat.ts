import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useGeminiFileUpload } from "./useGeminiFileUpload";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  configUpdates?: any;
}

interface ChatResponse {
  message: string;
  configUpdates: any;
  suggestions: {
    nextQuestions: string[];
    missingFields: string[];
  };
}

export const useSmartChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { config, updateConfig } = useWorkoutConfig();
  const { toast } = useToast();

  const { uploadAndProcessFile } = useGeminiFileUpload({ addMessage: (msg: ChatMessage) => setMessages(prev => [...prev, msg]) });

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('workout-chat', {
        body: {
          message: userMessage,
          currentConfig: config,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (error) throw error;

      const response: ChatResponse = data;
      
      if (
        response.configUpdates &&
        (response.configUpdates.goals || response.configUpdates.prescribedExercises)
      ) {
        const configUpdates: any = { ...response.configUpdates };
        
        if ('goals' in configUpdates && !configUpdates.prescribedExercises) {
          configUpdates.prescribedExercises = Array.isArray(configUpdates.goals)
            ? configUpdates.goals.join(", ")
            : configUpdates.goals;
          delete configUpdates.goals;
        }

        updateConfig(configUpdates);

        const updatedFields = Object.keys(configUpdates);
        const fieldNames = updatedFields.map(field => {
          switch(field) {
            case 'fitnessLevel': return 'Fitness Level';
            case 'prescribedExercises': return 'Goals';
            case 'selectedExercises': return 'Equipment';
            case 'numberOfDays': return 'Training Days';
            case 'numberOfCycles': return 'Cycles';
            case 'injuries': return 'Limitations';
            default: return field;
          }
        }).join(', ');

        toast({
          title: "✨ Configuration Updated",
          description: `Updated: ${fieldNames}`,
          duration: 4000,
        });

        window.dispatchEvent(new CustomEvent('configUpdated', { 
          detail: { updatedFields }
        }));
      } else if (response.configUpdates && Object.keys(response.configUpdates).length > 0) {
        
        updateConfig(response.configUpdates);
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        configUpdates: response.configUpdates
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing that. Could you try rephrasing your request?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
      
      toast({
        title: "Chat Error",
        description: error.message || "Failed to process message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, config, updateConfig, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your personal fitness coach. I'll help you create the perfect workout plan by updating your configuration on the right. Let's start - what's your current fitness level and what are your main goals?",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    }
  }, [messages.length]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleFileUpload = async (file: File) => {
    await uploadAndProcessFile(file);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    initializeChat,
    addMessage,
    handleFileUpload,
  };
};
