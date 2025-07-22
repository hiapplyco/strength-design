import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/firebase/useAuth';

export const useSharedContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);

  const shareContent = async (content: string, videoUrl?: string) => {
    setIsSharing(true);
    try {
      const sharedContentRef = collection(db, 'shared_content');
      
      const docRef = await addDoc(sharedContentRef, {
        content,
        video_url: videoUrl,
        user_id: user?.uid || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const shareableLink = `${window.location.origin}/shared/${docRef.id}`;
      setSharedLink(shareableLink);

      toast({
        title: "Content Shared Successfully",
        description: "Your content has been shared and can now be accessed via the generated link.",
      });

      return shareableLink;
    } catch (error) {
      console.error('Error sharing content:', error);
      toast({
        title: "Error",
        description: "Failed to share content. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    sharedLink,
    shareContent
  };
};