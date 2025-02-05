import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send } from "lucide-react";
import { FileUpload } from "@/components/chat/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface ChatMessage {
  id: string;
  message: string;
  response?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  created_at: string;
}

export default function ProgramChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const handleFileSelect = async (file: File) => {
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

      // First save the message
      const { data: messageData, error: dbError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user?.id,
          message: `Uploaded file: ${file.name}`,
          file_path: urlData.publicUrl,
          file_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Then get AI response
      const response = await supabase.functions.invoke('chat-with-gemini', {
        body: { 
          message: `Please analyze this file: ${file.name}`,
          fileUrl: urlData.publicUrl
        }
      });

      if (response.error) throw response.error;

      // Update the message with AI response
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: response.data.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });

      fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      // First save the message
      const { data: messageData, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user?.id,
          message: message.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setMessage("");

      // Then get AI response
      const response = await supabase.functions.invoke('chat-with-gemini', {
        body: { message: message.trim() }
      });

      if (response.error) throw response.error;

      // Update the message with AI response
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: response.data.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;

      fetchMessages();
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
          {/* Chat Header */}
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-semibold text-accent">Program Chat</h1>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className="bg-accent/5 rounded-lg p-4">
                    <p className="text-accent">
                      {msg.file_path ? (
                        <a 
                          href={msg.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {msg.message}
                        </a>
                      ) : (
                        msg.message
                      )}
                    </p>
                  </div>
                  {msg.response && (
                    <div className="bg-primary/5 rounded-lg p-4 ml-4">
                      <p className="text-primary">
                        {msg.response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-primary/20">
            <div className="flex items-center gap-2">
              <FileUpload onFileSelect={handleFileSelect} />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isLoading && (
              <div className="mt-2">
                <LoadingIndicator>Processing your request...</LoadingIndicator>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}