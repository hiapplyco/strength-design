
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const VideoSection = () => {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const video = document.querySelector('video');
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto -mt-12 mb-24 px-4">
      <div className="relative rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm border border-border">
        <div className="aspect-video relative">
          {/* Video temporarily disabled - Supabase instance deleted */}
          <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
            <p className="text-white/80 text-lg">Demo video coming soon</p>
          </div>
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
