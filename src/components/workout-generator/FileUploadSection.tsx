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
}

export function FileUploadSection({
  title,
  isAnalyzing,
  content,
  onFileSelect,
  analysisSteps,
}: FileUploadSectionProps) {
  return (
    <Card className="border-none bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <FileAnalysisState 
            title={`Analyzing ${title}`}
            steps={analysisSteps}
          />
        ) : (
          <>
            <PdfUploadSection onFileSelect={onFileSelect} />
            
            {content && (
              <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
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