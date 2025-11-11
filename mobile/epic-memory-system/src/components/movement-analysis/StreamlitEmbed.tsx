
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface StreamlitEmbedProps {
  streamlitUrl: string;
  height?: string;
}

export const StreamlitEmbed = ({ streamlitUrl, height = "600px" }: StreamlitEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Format the embed URL with proper query parameters
  const getEmbedUrl = () => {
    if (!streamlitUrl) return '';
    
    try {
      // Add the embed=true parameter to the URL
      const url = new URL(streamlitUrl);
      
      // Ensure we don't duplicate parameters if already present
      if (!url.searchParams.has('embed')) {
        url.searchParams.set('embed', 'true');
      }
      
      // Add embed options for better appearance
      if (!url.searchParams.has('embed_options')) {
        url.searchParams.append('embed_options', 'show_toolbar');
        url.searchParams.append('embed_options', 'show_padding');
      }
      
      return url.toString();
    } catch (e) {
      // If URL parsing fails, just append the parameters
      if (streamlitUrl.includes('?')) {
        return `${streamlitUrl}&embed=true&embed_options=show_toolbar&embed_options=show_padding`;
      }
      return `${streamlitUrl}?embed=true&embed_options=show_toolbar&embed_options=show_padding`;
    }
  };

  useEffect(() => {
    if (!streamlitUrl) return;
    
    setIsLoading(true);
    
    // Use a timeout to simulate checking the URL status
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [streamlitUrl]);

  // Preserve iframe state across route changes
  useEffect(() => {
    // Store a reference to the iframe element
    const iframe = iframeRef.current;
    
    return () => {
      // When component unmounts, don't destroy iframe content
      if (iframe && iframe.parentNode) {
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
    };
  }, []);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="space-y-4 p-4">
          <Skeleton className="w-full h-12 bg-gray-800/50" />
          <Skeleton className="w-full h-40 bg-gray-800/50" />
          <Skeleton className="w-3/4 h-8 bg-gray-800/50" />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          style={{ 
            width: '100%', 
            height: height, 
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent'
          }}
          allow="camera;microphone"
          title="Exercise Form Analyzer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        />
      )}
    </div>
  );
};
