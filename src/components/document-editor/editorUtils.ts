
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
  // Ensure we have an absolute URL for social sharing
  const absoluteUrl = url.startsWith('http') 
    ? url 
    : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const text = encodeURIComponent('Check out this document!');

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
