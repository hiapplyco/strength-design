
import { StreamlitEmbed } from "./StreamlitEmbed";
import { LogoHeader } from "@/components/ui/logo-header";

export const TechniqueAnalysisContent = () => {
  // Hardcoded Streamlit URL
  const streamlitUrl = "https://cfvideoanalysis.streamlit.app/";

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
            <div className="text-center mb-8">
              <LogoHeader>TECHNIQUE ANALYSIS</LogoHeader>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="bg-black/30 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
                <StreamlitEmbed streamlitUrl={streamlitUrl} height="800px" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
