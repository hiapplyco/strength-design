import { Card } from "@/components/ui/card";

interface ChatMessageProps {
  message: string;
  response?: string | null;
  file_path?: string | null;
}

export const ChatMessage = ({ message, response, file_path }: ChatMessageProps) => {
  return (
    <div className="space-y-2">
      <div className="bg-accent/5 rounded-lg p-4">
        <p className="text-accent">
          {file_path ? (
            <a 
              href={file_path} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {message}
            </a>
          ) : (
            message
          )}
        </p>
      </div>
      {response && (
        <div className="bg-primary/5 rounded-lg p-4 ml-4">
          <p className="text-primary">
            {response}
          </p>
        </div>
      )}
    </div>
  );
};