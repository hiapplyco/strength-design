
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

  return {
    isLoading,
    handleFileSelect
  };
};
