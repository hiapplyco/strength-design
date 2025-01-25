import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PdfUploadSection } from "./PdfUploadSection";
import { FileAnalysisState } from "./FileAnalysisState";

interface FileUploadSectionProps {
  title: string;
  isAnalyzing: boolean;
  content: string;
  onFileSelect: (file: File) => Promise<void>;
  analysisSteps: string[];
  className?: string;
}

export function FileUploadSection({
  title,
  isAnalyzing,
  content,
  onFileSelect,
  analysisSteps,
  className = "",
}: FileUploadSectionProps) {
  return (
    <Card className={`border-none bg-transparent ${className}`}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-2">
        {isAnalyzing ? (
          <FileAnalysisState 
            title={`Analyzing ${title}`}
            steps={analysisSteps}
          />
        ) : (
          <>
            <PdfUploadSection onFileSelect={onFileSelect} />
            
            {content && (
              <ScrollArea className="h-[60px] w-full rounded-md border border-input/50 bg-muted/30 p-2">
                <p className="text-xs text-muted-foreground">
                  {content}
                </p>
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}