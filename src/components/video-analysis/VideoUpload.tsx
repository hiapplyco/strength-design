
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  onFileUpload?: (file: File) => Promise<void>;
  onUploadComplete?: (url: string) => void;
}

export const VideoUpload = ({ 
  onFileSelect, 
  selectedFile, 
  onFileUpload,
  onUploadComplete 
}: VideoUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    
    if (file && onFileUpload) {
      handleUpload(file);
    }
  };
  
  const handleUpload = async (file: File) => {
    if (!onFileUpload) return;
    
    setIsUploading(true);
    try {
      await onFileUpload(file);
      toast({
        title: "Success",
        description: "Video uploaded successfully. Ready for analysis.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center bg-black/30">
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="sr-only"
          disabled={isUploading}
        />
        
        <label
          htmlFor="video"
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">Uploading video...</p>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-10 w-10 text-blue-500" />
              <p className="text-sm text-gray-400">{selectedFile.name}</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onFileSelect(null);
                }}
              >
                Change Video
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-lg font-medium text-white">Upload Video Here</p>
              <p className="text-sm text-gray-400">MP4, MOV, or WebM (max 100MB)</p>
              <Button 
                variant="default" 
                size="lg"
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('video')?.click();
                }}
              >
                Upload Video
              </Button>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};
