
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

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
          className="flex items-center justify-center w-10 h-10 cursor-pointer rounded-md"
        >
          <div className="relative">
            <Upload className="w-5 h-5" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70 blur-[1px] -z-10 rounded-md" />
          </div>
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
