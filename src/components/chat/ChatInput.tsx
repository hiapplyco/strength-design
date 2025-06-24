
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { FileUpload } from "@/components/chat/FileUpload";
import { FileUploadAnimation } from "@/components/chat/FileUploadAnimation";
import { AnimatePresence } from "framer-motion";
import { spacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, onFileSelect, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  const handleFileSelection = (file: File) => {
    setUploadingFile(file);
    onFileSelect(file);
  };

  return (
    <div className="border-t border-border bg-background">
      <AnimatePresence>
        {(isLoading || uploadingFile) && (
          <div className="p-2 flex justify-center">
            <FileUploadAnimation 
              isLoading={isLoading} 
              fileName={uploadingFile?.name || ''} 
            />
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className={spacing.component.md}>
        <div className="flex items-center gap-3">
          <FileUpload onFileSelect={handleFileSelection} />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
