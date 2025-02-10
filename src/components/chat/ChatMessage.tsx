
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMessageProps {
  message: string;
  response?: string | null;
  file_path?: string | null;
  created_at: string;
}

export const ChatMessage = ({ message, response, file_path, created_at }: ChatMessageProps) => {
  const timestamp = format(new Date(created_at), 'HH:mm');

  return (
    <div className="space-y-2">
      {/* User message */}
      <div className="flex flex-col items-end">
        <div className="flex items-end gap-2">
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          <div className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2",
            "bg-primary text-primary-foreground",
            "shadow-sm"
          )}>
            {file_path ? (
              <a 
                href={file_path} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {message}
              </a>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message}</p>
            )}
          </div>
        </div>
      </div>

      {/* AI response */}
      {response && (
        <div className="flex flex-col items-start">
          <div className="flex items-end gap-2">
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2",
              "bg-muted text-muted-foreground",
              "shadow-sm"
            )}>
              <p className="whitespace-pre-wrap break-words">{response}</p>
            </div>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};
