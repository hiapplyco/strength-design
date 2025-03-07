
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon, VideoIcon, MicIcon, ArrowRightIcon } from "lucide-react";
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
  };

  useEffect(() => {
    const checkStreamlitStatus = async () => {
      if (!streamlitUrl) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Simple HEAD request to check if the Streamlit app is accessible
        const response = await fetch(streamlitUrl, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        // Since we're using no-cors, we can't actually check status
        // But if this doesn't throw, the app is likely reachable
        setError(null);
        
        // Set loading to false after a short delay to allow the iframe to load
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch (err: any) {
        console.error("Error connecting to Streamlit:", err);
        setError("Could not connect to the Streamlit application. Please check the URL.");
        setIsLoading(false);
      }
    };
    
    checkStreamlitStatus();
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
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={openStreamlitApp}>
              Try Opening Directly <ExternalLinkIcon className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-sm text-gray-400">
              Note: You may need to open the Streamlit application in a separate browser window 
              due to cross-origin restrictions.
            </p>
          </div>
        ) : (
          <div className="h-full w-full">
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
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
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
