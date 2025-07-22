import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { documentQueries } from "@/lib/firebase/db";
import { copyToClipboard } from '../editorUtils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useDocumentPublisher() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [shareableLink, setShareableLink] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const { user } = useAuth();

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
      
      // Set base URL for shareable link
      const baseUrl = window.location.origin;
      
      // Create document in Firestore
      const documentId = await documentQueries.createDocument({
        content: content,
        title: 'Workout Document',
        url: '', // Will be updated after we have the ID
        userId: user?.uid // Set document ownership
      });

      console.log('Document created with ID:', documentId);

      if (onSave) {
        onSave(content);
      }

      // Complete shareable link with document ID
      const shareLink = `${baseUrl}/shared-document/${documentId}`;
      
      // Update the document with the final URL
      await documentQueries.updateDocument(documentId, {
        url: shareLink
      });

      setShareableLink(shareLink);
      console.log('Generated share link:', shareLink);

      const copySuccess = await copyToClipboard(shareLink);
      
      if (copySuccess) {
        toast({
          title: "Document Published!",
          description: "The shareable link has been copied to your clipboard.",
        });
      } else {
        toast({
          title: "Document Published!",
          description: "Document published successfully.",
        });
      }

      // Optionally navigate to the published document
      // navigate(`/shared-document/${documentId}`);
      
    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishDocument,
    shareableLink,
    isPublishing
  };
}