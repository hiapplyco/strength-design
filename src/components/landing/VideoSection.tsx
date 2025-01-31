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
    <div className="relative w-full max-w-5xl mx-auto my-8">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-black/30 to-black/10 backdrop-blur-sm border border-white/10">
        <div className="aspect-video relative">
          <video
            className="w-full h-full object-cover absolute inset-0"
            src="/videos/S.D.mov"
            autoPlay
            loop
            muted
            playsInline
          />
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