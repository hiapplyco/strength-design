
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";

interface AnalysisOptions {
  analysisType?: 'technique' | 'form' | 'performance' | 'beginner' | 'injury-prevention';
  customFrameRate?: number;
  startOffset?: string;
  endOffset?: string;
  useTimestamps?: boolean;
  customSystemPrompt?: string;
}

interface AnalysisOptionsFormProps {
  options: AnalysisOptions;
  onOptionsChange: (options: AnalysisOptions) => void;
}

export const AnalysisOptionsForm = ({ options, onOptionsChange }: AnalysisOptionsFormProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateOption = (key: keyof AnalysisOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  const analysisTypes = [
    { value: 'technique', label: 'Technique Analysis', description: 'General technique breakdown and improvement advice' },
    { value: 'form', label: 'Form & Alignment', description: 'Focus on body positioning and movement mechanics' },
    { value: 'performance', label: 'Performance Optimization', description: 'Competitive performance and efficiency analysis' },
    { value: 'beginner', label: 'Beginner Friendly', description: 'Patient, foundational skill development' },
    { value: 'injury-prevention', label: 'Injury Prevention', description: 'Safety-focused movement assessment' }
  ];

  return (
    <Card className="bg-black/20 border-gray-700 p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-white hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Advanced Analysis Options</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Analysis Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="analysisType" className="text-white">Analysis Focus</Label>
            <Select value={options.analysisType || 'technique'} onValueChange={(value) => updateOption('analysisType', value)}>
              <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                <SelectValue placeholder="Choose analysis type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {analysisTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-800">
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-400">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frame Rate */}
          <div className="space-y-2">
            <Label htmlFor="frameRate" className="text-white">Custom Frame Rate (FPS)</Label>
            <Input
              id="frameRate"
              type="number"
              min="0.1"
              max="30"
              step="0.1"
              placeholder="Default: 1 FPS"
              value={options.customFrameRate || ''}
              onChange={(e) => updateOption('customFrameRate', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="bg-black/30 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">Higher FPS for fast movements, lower for static analysis</p>
          </div>

          {/* Video Clipping */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startOffset" className="text-white">Start Time (MM:SS)</Label>
              <Input
                id="startOffset"
                placeholder="0:00"
                value={options.startOffset || ''}
                onChange={(e) => updateOption('startOffset', e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endOffset" className="text-white">End Time (MM:SS)</Label>
              <Input
                id="endOffset"
                placeholder="Full video"
                value={options.endOffset || ''}
                onChange={(e) => updateOption('endOffset', e.target.value)}
                className="bg-black/30 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Timestamp References */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useTimestamps"
              checked={options.useTimestamps || false}
              onCheckedChange={(checked) => updateOption('useTimestamps', checked)}
            />
            <Label htmlFor="useTimestamps" className="text-white text-sm">
              Include timestamp references in analysis
            </Label>
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt" className="text-white">Custom Analysis Prompt (Optional)</Label>
            <Textarea
              id="systemPrompt"
              placeholder="Override the default analysis approach with your custom instructions..."
              value={options.customSystemPrompt || ''}
              onChange={(e) => updateOption('customSystemPrompt', e.target.value)}
              className="bg-black/30 border-gray-700 text-white h-20"
            />
            <p className="text-xs text-gray-400">Leave blank to use the selected analysis type's default prompt</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
