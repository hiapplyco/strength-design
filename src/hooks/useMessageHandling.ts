
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  response?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  created_at: string;
}

export const useMessageHandling = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!user) return;

    try {
      console.log('Fetching messages for user:', user.id);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

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
      console.log('Sending message:', message);

      // First, save the message and get its ID
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: message
        })
        .select('*')
        .single();

      if (messageError) throw messageError;
      console.log('Message saved to database:', messageData);

      // Update local state immediately with the new message
      setMessages(prev => [...prev, messageData]);

      // Then, get the AI response
      const { data, error: geminiError } = await supabase.functions.invoke('chat-with-gemini', {
        body: { message }
      });

      if (geminiError) throw geminiError;
      console.log('Received Gemini response:', data);

      if (!data || !data.response) {
        throw new Error('Invalid response from AI');
      }

      // Update the message with the response
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: data.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;
      
      // Update local state with the response
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, response: data.response } : msg
      ));
      console.log('Response saved to database and state updated');

    } catch (error) {
      console.error('Error sending message:', error);
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
        description: "Chat history deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting messages:', error);
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
      description: "Started a new chat",
    });
  };

  return {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    deleteAllMessages,
    startNewChat
  };
};
