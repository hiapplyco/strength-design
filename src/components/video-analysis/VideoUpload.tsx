
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

interface VideoUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export const VideoUpload = ({ onFileSelect, selectedFile }: VideoUploadProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="video" className="text-sm">Video</Label>
      <div className="relative">
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          className="sr-only"
        />
        <label 
          htmlFor="video" 
          className="flex flex-col items-center justify-center w-full h-16 gap-2 cursor-pointer rounded-md border border-transparent hover:bg-background/10 transition-colors"
        >
          <div className="relative">
            <Video className="w-6 h-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md" />
          </div>
          <span className="text-[9px] text-muted-foreground">Upload video</span>
        </label>
      </div>
      
      {selectedFile && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  );
};
