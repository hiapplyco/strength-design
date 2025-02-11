
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('File uploaded, getting public URL:', urlData.publicUrl);

      // Save initial message to database
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

      console.log('Message saved to database:', messageData);

      // Process with Gemini
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke('chat-with-gemini', {
        body: { 
          message: `Please analyze this file: ${file.name}`,
          fileUrl: urlData.publicUrl
        }
      });

      if (geminiError) throw geminiError;

      console.log('Received Gemini response:', geminiData);

      if (!geminiData || !geminiData.response) {
        throw new Error('Invalid response from Gemini');
      }

      // Update message with Gemini's response
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ response: geminiData.response })
        .eq('id', messageData.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "File uploaded and analyzed successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload and analyze file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleFileSelect
  };
};
