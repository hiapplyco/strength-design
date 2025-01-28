import { toast } from "@/components/ui/use-toast";

export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Create a temporary textarea element
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

  try {
    // Try the new API first
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for Safari
    try {
      document.execCommand('copy');
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy text:', fallbackError);
      return false;
    }
  } finally {
    document.body.removeChild(textArea);
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

export const createShareableUrl = (documentId: string): string => {
  // Get the current window location origin to ensure correct base URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/document/${documentId}`;
};
