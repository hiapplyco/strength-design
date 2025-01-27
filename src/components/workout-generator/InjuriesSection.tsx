import { Activity } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";

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
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Injuries & Health Considerations</h3>
        <TooltipWrapper content="Share any injuries or health conditions that may affect your workout." />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <Textarea
            placeholder="List any injuries, medical conditions, or movement limitations"
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            className="min-h-[80px] bg-white text-black placeholder:text-gray-400"
          />
        </div>
        <div className="col-span-1">
          <FileUploadSection
            title="Upload Medical Information"
            isAnalyzing={isAnalyzingInjuries}
            content={injuries}
            onFileSelect={handleInjuriesFileSelect}
            analysisSteps={["Processing file", "Extracting conditions", "Analyzing restrictions"]}
          />
        </div>
      </div>
    </div>
  );
}