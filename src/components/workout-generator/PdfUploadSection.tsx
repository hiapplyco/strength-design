import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PdfUploadSectionProps {
  onFileSelect: (file: File) => Promise<void>;
}

export function PdfUploadSection({ onFileSelect }: PdfUploadSectionProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG)');
      event.target.value = '';
      return;
    }

    await onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <Input
        id="pdf"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: PDF, JPG, PNG
      </p>
    </div>
  );
}