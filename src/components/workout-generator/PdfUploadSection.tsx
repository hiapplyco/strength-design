import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { validateFileType } from "@/utils/geminiPrompts";
import { useToast } from "@/hooks/use-toast";

interface PdfUploadSectionProps {
  onFileSelect: (file: File | null) => void;
}

export function PdfUploadSection({ onFileSelect }: PdfUploadSectionProps) {
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onFileSelect(null);
      return;
    }

    try {
      validateFileType(file);
      onFileSelect(file);
    } catch (error) {
      toast({
        title: "File Error",
        description: error.message,
        variant: "destructive",
      });
      event.target.value = '';
      onFileSelect(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pdf">Upload Document or Image</Label>
      <Input
        id="pdf"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic"
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: PDF, JPG, PNG, HEIC
      </p>
    </div>
  );
}