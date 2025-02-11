
import { useState } from "react";
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";

const VideoAnalysisPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative z-10">
          <div className="container mx-auto px-4 pt-16 md:pt-24">
            <div className="text-center mb-8 md:mb-16 relative z-20">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-4 md:mb-6">
                publish.program
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-4">
                Create professional video content for your training programs. Our AI-powered teleprompter helps you deliver clear, engaging instructions to your audience.
              </p>
            </div>
            
            <div className="relative z-10">
              <VideoAnalysis />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisPage;
