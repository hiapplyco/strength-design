
import { useState } from 'react';
import { RecordingSection } from './components/RecordingSection';
import { useScriptGeneration } from './hooks/useScriptGeneration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export const VideoAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const { workoutScript, isGenerating, isReady, generateMonologue } = useScriptGeneration();

  const handleNarrate = () => {
    const workoutContent = "Please create a professional fitness instructor script for a 5-minute video that covers proper form for squats, lunges, and planks. Include a brief introduction, detailed instructions for each exercise focusing on alignment and common mistakes to avoid, and a motivational conclusion.";
    generateMonologue(workoutContent);
  };

  return (
    <Card className="bg-black/50 backdrop-blur-sm border border-gray-800 max-w-5xl mx-auto">
      <RecordingSection
        onNarrate={handleNarrate}
        onFileSelect={setSelectedFile}
        selectedFile={selectedFile}
        workoutScript={workoutScript}
        teleprompterPosition={teleprompterPosition}
        setTeleprompterPosition={setTeleprompterPosition}
      />
    </Card>
  );
};
