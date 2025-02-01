import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from '../editorUtils';
import { useNavigate } from 'react-router-dom';

export function useDocumentPublisher() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
      
      const baseUrl = window.location.origin;
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content,
          title: 'Workout Document',
          url: `${baseUrl}/shared-document/`
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

      const shareLink = `${baseUrl}/shared-document/${data.id}`;
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({ url: shareLink })
        .eq('id', data.id);

      if (updateError) {
        console.error('Error updating document URL:', updateError);
      }

      setShareableLink(shareLink);
      console.log('Generated share link:', shareLink);

      const copySuccess = await copyToClipboard(shareLink);
      
      toast({
        title: copySuccess ? "Link Copied!" : "Success",
        description: copySuccess 
          ? "The shareable link has been copied to your clipboard."
          : "Your document has been published and can now be shared.",
      });

      // Navigate to video analysis with the content
      navigate('/video-analysis', { 
        state: { 
          workoutScript: content,
          documentId: data.id
        }
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