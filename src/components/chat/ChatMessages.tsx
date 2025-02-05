import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";

interface ChatMessagesProps {
  messages: Array<{
    id: string;
    message: string;
    response?: string | null;
    file_path?: string | null;
  }>;
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            response={msg.response}
            file_path={msg.file_path}
          />
        ))}
      </div>
    </ScrollArea>
  );
};