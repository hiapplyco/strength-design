
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserDataIntegration } from "./useUserDataIntegration";
import { useWorkoutTemplates } from "./useWorkoutTemplates";

interface ChatMessage {
  id: string;
  message: string;
  response?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  created_at: string;
}

export const useEnhancedChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { userData, generateUserContext } = useUserDataIntegration();
  const { workoutTemplates } = useWorkoutTemplates();

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching enhanced chat messages for user:', user.id);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching messages:', error);
        throw error;
      }

      console.log('Fetched enhanced chat messages:', data);
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching enhanced chat messages:', error);
      
      // More user-friendly error handling
      if (error.message?.includes('Failed to fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Loading Messages",
          description: "There was a problem loading your chat history. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
  }, [user, toast]);

  const handleSendMessage = async (message: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending enhanced chat message:', message);

      // Save the message to database first
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: message
        })
        .select('*')
        .single();

      if (messageError) {
        console.error('Error saving message:', messageError);
        throw messageError;
      }

      console.log('Enhanced chat message saved:', messageData);

      // Update local state immediately with user message
      setMessages(prev => [...prev, messageData]);

      // Build conversation history for AI context
      const history = messages.map(msg => [
        { role: 'user', parts: [{ text: msg.message }] },
        ...(msg.response ? [{ role: 'model', parts: [{ text: msg.response }] }] : [])
      ]).flat();

      // Prepare enhanced context with workout templates and user data
      const workoutContext = workoutTemplates?.length > 0 ? 
        `\n\nUSER'S WORKOUT TEMPLATES:\n${workoutTemplates.map(template => 
          `- ${template.title}: ${template.summary || 'Custom workout'}`
        ).join('\n')}` : '';

      // Call enhanced chat function with comprehensive user data
      const { data: chatResponse, error: chatError } = await supabase.functions.invoke('enhanced-chat', {
        body: { 
          message,
          messageId: messageData.id,
          history: history,
          userId: user.id,
          workoutContext,
          hasWorkoutTemplates: workoutTemplates?.length > 0
        }
      });

      if (chatError) {
        console.error('Enhanced chat function error:', chatError);
        throw chatError;
      }

      console.log('Received enhanced AI response:', chatResponse);

      if (!chatResponse || !chatResponse.response) {
        throw new Error('Invalid response from AI chat service');
      }

      // Update local state with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, response: chatResponse.response } : msg
      ));

      console.log('Enhanced chat local state updated successfully');

    } catch (error: any) {
      console.error('Error in enhanced chat:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to send message. Please try again.";
      
      if (error.message?.includes('Invalid response')) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Connection error. Please check your internet connection.";
      } else if (error.message?.includes('enhanced-chat')) {
        errorMessage = "Chat service is temporarily unavailable. Please try again.";
      }

      toast({
        title: "Message Send Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllMessages = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMessages([]);
      toast({
        title: "Success",
        description: "Chat history cleared successfully",
      });
    } catch (error: any) {
      console.error('Error deleting enhanced chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    toast({
      title: "New Chat Started",
      description: "Started a fresh conversation with your AI coach",
    });
  };

  return {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    deleteAllMessages,
    startNewChat,
    userDataSummary: userData,
    hasUserData: !!userData,
    workoutTemplates: workoutTemplates || []
  };
};
