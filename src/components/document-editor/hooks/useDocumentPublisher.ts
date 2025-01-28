import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentPublisher() {
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const publishDocument = async (content: string, onSave?: (content: string) => void) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Document content cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsPublishing(true);
      
      // Insert the document content into the documents table
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content,
          title: 'Workout Document'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (onSave) {
        onSave(content);
      }

      // Generate the shareable link using the document ID
      const shareLink = `${window.location.origin}/shared-document/${data.id}`;
      setShareableLink(shareLink);

      toast({
        title: "Success",
        description: "Your document has been published and can now be shared.",
      });

    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Error",
        description: "Failed to publish document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    shareableLink,
    isPublishing,
    publishDocument
  };
}