
import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  onFileUpload: (file: File) => Promise<string>;
  onUploadComplete: (url: string) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onFileSelect,
  selectedFile,
  onFileUpload,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    setError(null);
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first");
      return;
    }

    setUploading(true);
    setProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      // Upload the file
      const url = await onFileUpload(selectedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploadComplete(true);
      onUploadComplete(url);
    } catch (error) {
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          {selectedFile ? 'Change Video' : 'Select Video'}
        </Button>
        
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading || uploadComplete}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : uploadComplete ? 'Uploaded' : 'Upload Video'}
        </Button>
        
        <input
          id="file-upload"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      
      {selectedFile && (
        <div className="text-sm">
          <p>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-center">{progress}%</p>
        </div>
      )}

      {uploadComplete && (
        <div className="flex items-center text-green-500">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Upload complete!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center text-red-500">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
