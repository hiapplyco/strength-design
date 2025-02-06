import { HeartPulse, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface InjuriesSectionProps {
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
}

export function InjuriesSection({
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect
}: InjuriesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    setInjuries("");
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      className="collapsible-section"
    >
      <div className="flex items-center justify-between py-3 px-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <HeartPulse className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg whitespace-nowrap">Any Injuries or Health Considerations?</h3>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-transparent hover:underline ml-2"
            >
              <span className="sr-only">Toggle Injuries Section</span>
            </Button>
          </CollapsibleTrigger>
          <TooltipWrapper content="Share any injuries, medical conditions, or movement limitations that may affect your workout" />
        </div>
        {injuries && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CollapsibleContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Textarea
              placeholder="List any injuries, medical conditions, or movement limitations"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className="min-h-[100px] my-input-element"
            />
          </div>
          <div className="md:col-span-1 min-w-[200px]">
            <FileUploadSection
              title="Upload Medical Information"
              isAnalyzing={isAnalyzingInjuries}
              content={injuries}
              onFileSelect={handleInjuriesFileSelect}
              analysisSteps={["Processing file", "Extracting information", "Analyzing content"]}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}