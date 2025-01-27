import { toast } from "@/components/ui/use-toast";

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
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
  // Use window.location.origin to get the base URL of the current environment
  const baseUrl = window.location.origin;
  // Construct the full URL to the document viewer page
  return `${baseUrl}/document/${documentId}`;
};