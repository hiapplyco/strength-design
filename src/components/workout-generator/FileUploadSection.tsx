
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAnalysisState } from "./FileAnalysisState";
import { PdfUploadSection } from "./PdfUploadSection";
import { Check } from "lucide-react";
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
  return (
    <Card className={cn("bg-transparent border-0 shadow-none", className)}>
      <CardHeader className="p-0 pb-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xs font-medium text-white/80">{title}</CardTitle>
          {isSuccess && <Check className="h-3 w-3 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isAnalyzing ? 
          <FileAnalysisState title={`Analyzing ${title}`} steps={analysisSteps} /> : 
          <PdfUploadSection onFileSelect={onFileSelect} />
        }
      </CardContent>
    </Card>
  );
}
