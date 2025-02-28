
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, image, or text file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 4MB",
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
        className="hidden"
        id="file-upload"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-4 w-4" />
        </label>
      </Button>
    </div>
  );
};
