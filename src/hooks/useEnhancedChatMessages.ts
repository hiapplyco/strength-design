
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserDataIntegration } from "./useUserDataIntegration";

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

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching enhanced chat messages for user:', user.id);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched enhanced chat messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching enhanced chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const handleSendMessage = async (message: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending enhanced chat message:', message);

      // Save the message to database
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: message
        })
        .select('*')
        .single();

      if (messageError) throw messageError;
      console.log('Enhanced chat message saved:', messageData);

      // Update local state immediately
      setMessages(prev => [...prev, messageData]);

      // Build conversation history for AI context
      const history = messages.map(msg => [
        { role: 'user', parts: [{ text: msg.message }] },
        ...(msg.response ? [{ role: 'model', parts: [{ text: msg.response }] }] : [])
      ]).flat();

      // Call enhanced chat function with user data integration
      const { data, error: chatError } = await supabase.functions.invoke('enhanced-chat', {
        body: { 
          message,
          messageId: messageData.id,
          history: history,
          userId: user.id, // Pass user ID for data integration
        }
      });

      if (chatError) throw chatError;
      console.log('Received enhanced AI response:', data);

      if (!data || !data.response) {
        throw new Error('Invalid response from enhanced AI');
      }

      // Update local state with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, response: data.response } : msg
      ));
      console.log('Enhanced chat local state updated');

    } catch (error) {
      console.error('Error in enhanced chat:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
        description: "Enhanced chat history deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting enhanced chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    toast({
      title: "Success",
      description: "Started a new enhanced chat session",
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
    hasUserData: !!userData
  };
};
