
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon, VideoIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";

interface StreamlitEmbedProps {
  streamlitUrl: string;
  height?: string;
}

export const StreamlitEmbed = ({ streamlitUrl, height = "600px" }: StreamlitEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    setError(null);
    
    // Use a timeout to simulate checking the URL status
    // This avoids actual fetch which may cause CORS issues
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [streamlitUrl]);

  const openStreamlitApp = () => {
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full border border-gray-700 rounded-lg overflow-hidden bg-black/30">
      <div className="p-3 bg-black/50 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-medium flex items-center">
          <VideoIcon className="mr-2 h-4 w-4" /> 
          Exercise Form Analyzer
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openStreamlitApp} 
          className="text-xs"
        >
          Open Analyzer App <ExternalLinkIcon className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="p-4" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-12 bg-gray-800/50" />
            <Skeleton className="w-full h-40 bg-gray-800/50" />
            <Skeleton className="w-3/4 h-8 bg-gray-800/50" />
          </div>
        ) : (
          <div className="h-full w-full">
            {streamlitUrl ? (
              <>
                <iframe
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
                <div className="mt-3 p-3 bg-orange-950/30 border border-orange-800/50 rounded-md">
                  <div className="flex gap-2 text-white">
                    <InfoIcon className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">
                        If you're seeing a connection error, please try opening the Streamlit app directly using the "Open Analyzer App" button above. 
                        Embedded Streamlit apps may be limited by cross-origin restrictions.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Please enter a valid Streamlit URL in the configuration section.</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open("https://streamlit.io/cloud", "_blank")}
                >
                  Learn About Streamlit Cloud
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-black/20 border-t border-gray-800">
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          <span className="bg-black/30 px-2 py-1 rounded-full">AI-Powered Analysis</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Voice Feedback</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Form Correction</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Training Insights</span>
        </div>
      </div>
    </div>
  );
};
