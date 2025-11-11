
import { useState, useCallback } from "react";
import { db, functions } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  user_id?: string;
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

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching messages for user:', user.uid);
      const messagesRef = collection(db, 'chat_messages');
      const q = query(
        messagesRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'asc')
      );
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as ChatMessage[];

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
      console.log('Sending message:', message);

      // First, save the message and get its ID
      const messagesRef = collection(db, 'chat_messages');
      const messageDoc = await addDoc(messagesRef, {
        user_id: user.uid,
        message: message,
        created_at: Timestamp.now()
      });

      const messageData: ChatMessage = {
        id: messageDoc.id,
        user_id: user.uid,
        message: message,
        created_at: new Date().toISOString()
      };

      console.log('Message saved to database:', messageData);

      // Update local state immediately with the new message
      setMessages(prev => [...prev, messageData]);

      const history = messages.map(msg => [
        { role: 'user', parts: [{ text: msg.message }] },
        ...(msg.response ? [{ role: 'model', parts: [{ text: msg.response }] }] : [])
      ]).flat();

      // Then, get the AI response
      const chatWithGemini = httpsCallable(functions, 'chatWithGemini');
      const result = await chatWithGemini({
        message,
        messageId: messageDoc.id,
        history: history,
      });

      const data = result.data as { response: string };
      console.log('Received Gemini response:', data);

      if (!data || !data.response) {
        throw new Error('Invalid response from AI');
      }

      // Update local state with the response from Gemini
      setMessages(prev => prev.map(msg =>
        msg.id === messageData.id ? { ...msg, response: data.response } : msg
      ));
      console.log('Local state updated with response');

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
      const messagesRef = collection(db, 'chat_messages');
      const q = query(messagesRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      // Delete all messages for this user
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

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
