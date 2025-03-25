
import { StreamlitEmbed } from "./StreamlitEmbed";
import { LogoHeader } from "@/components/ui/logo-header";
import { useEffect, useState } from "react";

export const TechniqueAnalysisContent = () => {
  // Hardcoded Streamlit URL
  const streamlitUrl = "https://cfvideoanalysis.streamlit.app/";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative isolate">
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8">
              <LogoHeader>TECHNIQUE ANALYSIS</LogoHeader>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="bg-card/30 rounded-lg overflow-hidden border border-border shadow-xl">
                {mounted && <StreamlitEmbed streamlitUrl={streamlitUrl} height="800px" />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
