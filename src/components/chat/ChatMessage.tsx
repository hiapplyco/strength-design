
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { marked } from "marked";

interface ChatMessageProps {
  message: string;
  response?: string | null;
  file_path?: string | null;
  created_at: string;
}

export const ChatMessage = ({ message, response, file_path, created_at }: ChatMessageProps) => {
  const timestamp = format(new Date(created_at), 'HH:mm');

  const renderMarkdown = (text: string) => {
    return { __html: marked(text, { breaks: true }) };
  };

  return (
    <div className="space-y-2">
      {/* User message */}
      <div className="flex flex-col items-end">
        <div className="flex items-end gap-2">
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          <div className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2",
            "bg-white text-black dark:bg-accent dark:text-white", 
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
              <p 
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={renderMarkdown(message)}
              />
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
              <p 
                className="whitespace-pre-wrap break-words prose prose-invert dark:prose-invert"
                dangerouslySetInnerHTML={renderMarkdown(response)}
              />
            </div>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
}
