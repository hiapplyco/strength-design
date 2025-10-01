
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSharedContent = () => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);

  const shareContent = async (content: string, videoUrl?: string) => {
    setIsSharing(true);
    try {
      const { data, error } = await supabase
        .from('shared_content')
        .insert([
          {
            content,
            video_url: videoUrl
          }
        ])
        .select('id')
        .single();

      if (error) throw error;

      const shareableLink = `${window.location.origin}/shared/${data.id}`;
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
