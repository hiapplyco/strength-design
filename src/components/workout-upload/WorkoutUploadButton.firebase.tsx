import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/firebase/useAuth";
import { toast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const ACCEPTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt']
};

export function WorkoutUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const functions = getFunctions();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload workout files",
        variant: "destructive"
      });
      navigate("/auth", { state: { from: { pathname: "/" } } });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to Firebase Storage
      const fileName = `workout-uploads/${user.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const uploadResult = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          userId: user.uid,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      // Get the download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Call Firebase Function to process the file
      const processWorkoutUpload = httpsCallable(functions, 'processWorkoutUpload');
      const result = await processWorkoutUpload({
        fileName: fileName,
        fileType: file.type,
        originalName: file.name,
        downloadUrl: downloadUrl
      });

      const data = result.data as any;

      toast({
        title: "Upload successful!",
        description: "Your workout is being processed. You'll be redirected shortly.",
      });

      // Redirect to the generated workout or a processing page
      if (data?.workoutId) {
        navigate(`/generated-workouts/${data.workoutId}`);
      } else {
        navigate('/workout-generator');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="file"
        id="workout-upload"
        className="hidden"
        accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <label htmlFor="workout-upload">
        <Button
          size="lg"
          className="w-full h-32 text-lg font-bold bg-gradient-to-r from-primary via-orange-500 to-red-500 hover:from-primary/90 hover:via-orange-500/90 hover:to-red-500/90 text-white shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <div className="flex flex-col items-center justify-center gap-3 p-6">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin" />
                <span>Processing your workout...</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Upload className="h-10 w-10" />
                  <FileText className="h-8 w-8" />
                </div>
                <span className="text-xl">Upload Your Workout HERE</span>
                <span className="text-sm font-normal opacity-90">
                  Supports images, CSV, Word, PDF, and text files
                </span>
              </>
            )}
          </div>
        </Button>
      </label>
    </div>
  );
}