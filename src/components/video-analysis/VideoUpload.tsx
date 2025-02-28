
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VideoUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export const VideoUpload = ({ onFileSelect, selectedFile }: VideoUploadProps) => {
  return (
    <div className="space-y-2">
      <div className="grid w-full max-w-sm items-center gap-1">
        <Label htmlFor="video" className="text-sm">Video</Label>
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          className="cursor-pointer h-8 text-xs file:text-xs py-0"
          borderStyle="multicolor"
        />
      </div>
      {selectedFile && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  );
};
