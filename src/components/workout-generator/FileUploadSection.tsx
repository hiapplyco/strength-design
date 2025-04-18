
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAnalysisState } from "./FileAnalysisState";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadSectionProps {
  title: string;
  isAnalyzing: boolean;
  isSuccess?: boolean;
  content: string;
  onFileSelect: (file: File) => Promise<void>;
  analysisSteps: string[];
  className?: string;
}

export function FileUploadSection({
  title,
  isAnalyzing,
  isSuccess,
  content,
  onFileSelect,
  analysisSteps,
  className = ""
}: FileUploadSectionProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card className={cn("bg-transparent border-0 shadow-none", className)}>
      <CardHeader className="p-0 pb-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xs font-medium text-white/80">{title}</CardTitle>
          {isSuccess && <Check className="h-3 w-3 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isAnalyzing ? (
          <FileAnalysisState title={`Analyzing ${title}`} steps={analysisSteps} />
        ) : (
          <div className="flex items-center">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
              id={`file-upload-${title}`}
            />
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-8 w-8 bg-gradient-to-r from-[#4CAF50]/10 via-[#9C27B0]/10 to-[#FF1493]/10 hover:bg-gradient-to-r hover:from-[#4CAF50]/20 hover:via-[#9C27B0]/20 hover:to-[#FF1493]/20"
            >
              <label htmlFor={`file-upload-${title}`} className="cursor-pointer flex items-center justify-center">
                <Upload className="h-4 w-4" />
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
