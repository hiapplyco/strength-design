
import { LogoHeader } from "@/components/ui/logo-header";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const TechniqueAnalysis = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Log when component mounts
  useEffect(() => {
    console.log('TechniqueAnalysis component mounted');
    
    // Add an event listener to window to catch any errors
    const handleWindowError = (event: ErrorEvent) => {
      console.error('Window error caught:', event);
      if (event.message.includes('iframe') || event.message.includes('streamlit')) {
        toast.error("Error loading analysis tool: " + event.message);
      }
    };
    
    window.addEventListener('error', handleWindowError);
    return () => window.removeEventListener('error', handleWindowError);
  }, []);

  // Handle iframe loading state and errors
  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIsLoading(false);
    // Reset load attempts on successful load
    setLoadAttempts(0);
  };

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('Iframe failed to load:', e);
    setLoadError(true);
    setIsLoading(false);
    setLoadAttempts(prev => prev + 1);
    toast.error("Failed to load the video analysis tool. Please try again later.");
  };

  // Attempt to reload the iframe
  const handleRetry = () => {
    console.log('Attempting to reload the iframe');
    setIsLoading(true);
    setLoadError(false);
    
    try {
      // Force iframe refresh with cache-busting parameter
      if (iframeRef.current) {
        const timestamp = Date.now();
        console.log(`Reloading iframe with timestamp: ${timestamp}`);
        iframeRef.current.src = `https://cfvideoanalysis.streamlit.app/?t=${timestamp}`;
      }
    } catch (error) {
      console.error('Error during iframe reload:', error);
      setLoadError(true);
      setIsLoading(false);
      toast.error("Failed to reload. Please try again later.");
    }
  };

  // Try different approach after multiple failures
  useEffect(() => {
    if (loadAttempts >= 3) {
      console.log('Multiple load attempts failed, trying alternative approach');
      // Could implement alternative loading strategy here
      toast.info("Having trouble loading the analysis tool. We're trying an alternative approach.");
    }
  }, [loadAttempts]);

  return (
    <div className="min-h-screen w-full">
      <div className="relative isolate">
        <div 
          className="fixed inset-0 -z-10 bg-black"
          style={{
            backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
        
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8 md:mb-12">
              <LogoHeader>Jiu-Jitsu Technique Analysis</LogoHeader>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                Upload a video of your jiu-jitsu technique for expert AI analysis and feedback
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-black/40">
              {isLoading && (
                <div className="flex items-center justify-center h-[600px]">
                  <LoadingIndicator>
                    Loading analysis tool...
                  </LoadingIndicator>
                </div>
              )}

              {loadError && (
                <div className="flex flex-col items-center justify-center h-[600px] p-6 text-center">
                  <div className="text-red-400 mb-4 text-5xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Failed to load analysis tool</h3>
                  <p className="text-white/70 mb-6">
                    The external analysis tool is currently unavailable. This may be due to high traffic or temporary maintenance.
                  </p>
                  <Button onClick={handleRetry} variant="default">
                    Try Again
                  </Button>
                </div>
              )}

              <iframe 
                ref={iframeRef}
                id="analysis-iframe"
                src="https://cfvideoanalysis.streamlit.app/"
                title="BJJ Video Analysis Tool"
                className={`w-full h-[800px] ${isLoading || loadError ? 'hidden' : 'block'}`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                allow="camera; microphone; autoplay; clipboard-write; encrypted-media"
                referrerPolicy="origin"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>

            <div className="max-w-3xl mx-auto mt-8 p-4 bg-black/30 rounded-lg border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">How to use the analysis tool:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-white/80">
                <li>Upload a video of your jiu-jitsu technique (up to 20MB)</li>
                <li>Enter a specific question about your technique</li>
                <li>Click "Analyze" and wait for the AI to evaluate your movement</li>
                <li>Review the detailed feedback and implement the suggestions</li>
              </ol>
              <p className="mt-4 text-sm text-white/60">
                Note: All videos are processed securely and not stored permanently. 
                If you encounter loading issues, please try refreshing the page or using another browser.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechniqueAnalysis;
