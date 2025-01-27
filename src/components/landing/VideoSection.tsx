import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VideoSectionProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VideoSection = ({ isMuted, onToggleMute }: VideoSectionProps) => {
  return (
    <section className="relative h-screen w-full overflow-hidden mt-16 px-8 md:px-16 lg:px-24">
      <div className="absolute inset-8 md:inset-16 lg:inset-24">
        <div className="relative h-full w-full">
          <video
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain rounded-lg"
          >
            <source src="https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/videos/S.D.mov?t=2025-01-27T00%3A24%3A48.059Z" type="video/mp4" />
          </video>
        </div>
      </div>

      <Button
        onClick={onToggleMute}
        className="absolute top-12 right-12 z-50 bg-black/50 hover:bg-black/70 md:top-20 md:right-20 lg:top-28 lg:right-28"
        size="icon"
        variant="ghost"
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>
    </section>
  );
};