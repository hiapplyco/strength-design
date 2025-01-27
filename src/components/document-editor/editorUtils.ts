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
  // Include the anon key as a query parameter
  return `https://ulnsvkrrdcmfiguibkpx.supabase.co/rest/v1/documents?id=eq.${documentId}&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbnN2a3JyZGNtZmlndWlia3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTk4NzcsImV4cCI6MjA1MjY5NTg3N30.L_ysW1DZXZPXwJT5pn_IepuZwP9zILravQTqv38MccI`;
};