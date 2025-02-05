import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { FileUpload } from "@/components/chat/FileUpload";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, onFileSelect, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-primary/20">
      <div className="flex items-center gap-2">
        <FileUpload onFileSelect={onFileSelect} />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {isLoading && (
        <div className="mt-2">
          <LoadingIndicator>Processing your request...</LoadingIndicator>
        </div>
      )}
    </form>
  );
};