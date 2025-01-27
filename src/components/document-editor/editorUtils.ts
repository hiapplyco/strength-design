export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      textArea.remove();
      return false;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const generateShareUrl = (platform: 'facebook' | 'twitter' | 'linkedin', shareableLink: string) => {
  const urls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent('Check out my document!')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableLink)}`,
  };

  return urls[platform];
};

export const createShareableUrl = (documentId: string): string => {
  // Get the current hostname, which will be different in dev and prod
  const currentHostname = window.location.hostname;
  
  // Check if we're in development
  if (currentHostname === 'localhost' || currentHostname.includes('.lovable.dev')) {
    return `${window.location.origin}/document/${documentId}`;
  }
  
  // For production with custom domain
  return `https://www.strength.design/document/${documentId}`;
};