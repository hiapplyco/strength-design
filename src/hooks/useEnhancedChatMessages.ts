
import { useState, useCallback, useRef } from "react";
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
  const { userData } = useUserDataIntegration();
  const { workoutTemplates } = useWorkoutTemplates();
  
  // Add refs to prevent multiple simultaneous operations and manage session state
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const hasLoadedMessagesRef = useRef(false);
  const isNewChatSessionRef = useRef(false); // Track if user started a new chat session

  const fetchMessages = useCallback(async () => {
    // Don't fetch if we're in a new chat session (user clicked "New Chat")
    if (!user || fetchingRef.current || hasLoadedMessagesRef.current || isNewChatSessionRef.current) return;
    
    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) return;
    
    fetchingRef.current = true;
    lastFetchRef.current = now;

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
      
      // Only set messages if we have data, otherwise keep empty array
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      
      // Mark as having loaded messages to prevent re-fetching
      hasLoadedMessagesRef.current = true;
      
      // Mark as initialized only after successful fetch
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
    } catch (error: any) {
      console.error('Error fetching enhanced chat messages:', error);
      
      toast({
        title: "Connection Issue",
        description: "Unable to load chat history. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      fetchingRef.current = false;
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

    if (isLoading) {
      console.log('Message sending already in progress, skipping...');
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
        throw new Error('No response received from AI chat service');
      }

      // Update local state with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, response: chatResponse.response } : msg
      ));

      console.log('Enhanced chat local state updated successfully');

    } catch (error: any) {
      console.error('Error in enhanced chat:', error);
      
      let errorMessage = "Failed to send message. Please try again.";
      
      if (error.message?.includes('No response received')) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Connection error. Please check your internet connection.";
      }

      toast({
        title: "Message Send Failed", 
        description: errorMessage,
        variant: "destructive",
      });
      
      // Remove the failed message from local state if it was added
      setMessages(prev => prev.filter(msg => msg.message !== message || msg.response));
      
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllMessages = async () => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMessages([]);
      // Reset all flags so fresh messages can load properly
      initializedRef.current = false;
      hasLoadedMessagesRef.current = false;
      isNewChatSessionRef.current = false;
      
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
    // Clear current messages from view but don't delete from database
    setMessages([]);
    
    // Mark as new chat session to prevent auto-loading of old messages
    isNewChatSessionRef.current = true;
    
    // Don't reset hasLoadedMessagesRef - this prevents refetching old messages
    // Don't reset initializedRef - we know the system is ready
    
    toast({
      title: "New Chat Started",
      description: "Started a fresh conversation with your AI coach",
    });
  };

  const resumeChat = async () => {
    // Reset the new chat session flag and allow fetching of existing messages
    isNewChatSessionRef.current = false;
    hasLoadedMessagesRef.current = false;
    
    // Fetch existing messages
    await fetchMessages();
    
    toast({
      title: "Chat Resumed",
      description: "Loaded your previous conversation history",
    });
  };

  return {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    deleteAllMessages,
    startNewChat,
    resumeChat,
    userDataSummary: userData,
    hasUserData: !!userData,
    workoutTemplates: workoutTemplates || [],
    isInitialized: initializedRef.current,
    isNewChatSession: isNewChatSessionRef.current
  };
};
