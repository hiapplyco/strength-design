
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";

interface ChatMessage {
  id: string;
  message: string;
  response?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  created_at: string;
}

export default function ProgramChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    // Set up realtime subscription for messages
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    // Initial fetch
    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      console.log('Fetching messages for user:', user.id);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

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

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const filePath = `chat-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('File uploaded, getting public URL:', urlData.publicUrl);

      const { data: messageData, error: dbError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: `Uploaded file: ${file.name}`,
          file_path: urlData.publicUrl,
          file_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      console.log('Message saved to database, calling Gemini:', messageData);

      const response = await supabase.functions.invoke('chat-with-gemini', {
        body: { 
          message: `Please analyze this file: ${file.name}`,
          fileUrl: urlData.publicUrl
        }
      });

      console.log('Received Gemini response:', response);

      if (response.error) throw response.error;

      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: response.data.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload and process file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: message
        })
        .select()
        .single();

      if (messageError) throw messageError;
      console.log('Message saved to database:', messageData);

      const { data: response, error: geminiError } = await supabase.functions.invoke('chat-with-gemini', {
        body: { message }
      });

      if (geminiError) throw geminiError;
      console.log('Received Gemini response:', response);

      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: response.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;
      console.log('Response saved to database');

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto bg-background/5 border border-primary/20 backdrop-blur-sm">
        <div className="flex flex-col h-[80vh]">
          <ChatHeader />
          <ChatMessages messages={messages} />
          <ChatInput 
            onSendMessage={handleSendMessage}
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  );
}
