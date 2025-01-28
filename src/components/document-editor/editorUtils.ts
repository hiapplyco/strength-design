import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for Safari
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but keep it in the viewport for iOS
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackError) {
      console.error('Failed to copy text:', fallbackError);
      return false;
    }
  }
};

export const generateShareUrl = (platform: 'facebook' | 'twitter' | 'linkedin', url: string): string => {
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent('Check out this workout document!');

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return '';
  }
};

export const createShareableUrl = async (documentId: string): Promise<string> => {
  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'share_base_url')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const baseUrl = settings?.value || window.location.origin;
    return `${baseUrl}/document/${documentId}`.replace(/([^:]\/)\/+/g, "$1");
  } catch (error) {
    console.error('Failed to create shareable URL:', error);
    toast({
      title: "Error",
      description: "Failed to generate shareable link. Please try again.",
      variant: "destructive"
    });
    return '';
  }
};