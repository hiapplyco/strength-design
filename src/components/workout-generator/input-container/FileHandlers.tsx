
import { useCallback } from "react";

interface FileHandlersProps {
  handleFileProcessing: (file: File, contentType: 'prescribed' | 'injuries', parseDocument: Function) => Promise<void>;
  parseDocument: Function;
}

export function useFileHandlers({ handleFileProcessing, parseDocument }: FileHandlersProps) {
  const handlePrescribedFileSelect = useCallback(async (file: File) => {
    await handleFileProcessing(file, 'prescribed', parseDocument);
  }, [handleFileProcessing, parseDocument]);
  
  const handleInjuriesFileSelect = useCallback(async (file: File) => {
    await handleFileProcessing(file, 'injuries', parseDocument);
  }, [handleFileProcessing, parseDocument]);

  return {
    handlePrescribedFileSelect,
    handleInjuriesFileSelect
  };
}
