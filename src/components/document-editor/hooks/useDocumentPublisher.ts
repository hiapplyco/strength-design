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
      console.log('Publishing document with content:', content.substring(0, 100) + '...');
      
      // Use the production domain with www prefix
      const baseUrl = 'https://www.hiapply.co';
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content,
          title: 'Workout Document',
          url: `${baseUrl}/shared-document/` // We'll append the ID after we get it
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || !data.id) {
        console.error('No data returned from insert');
        throw new Error('Failed to get document ID after insert');
      }

      console.log('Document created with ID:', data.id);

      if (onSave) {
        onSave(content);
      }

      // Generate shareable link using the document ID and production base URL
      const shareLink = `${baseUrl}/shared-document/${data.id}`;
      
      // Update the document with the complete URL
      const { error: updateError } = await supabase
        .from('documents')
        .update({ url: shareLink })
        .eq('id', data.id);

      if (updateError) {
        console.error('Error updating document URL:', updateError);
        // Don't throw here, as the document is still created
      }

      setShareableLink(shareLink);
      console.log('Generated share link:', shareLink);

      toast({
        title: "Success",
        description: "Your document has been published and can now be shared.",
      });

    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish document. Please try again.",
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