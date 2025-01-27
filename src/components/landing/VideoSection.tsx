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
    <div className="relative w-full max-w-5xl mx-auto mb-12">
      <div className="relative rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10">
        <video
          className="w-full aspect-video object-cover"
          src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z"
          autoPlay
          loop
          muted
          playsInline
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};