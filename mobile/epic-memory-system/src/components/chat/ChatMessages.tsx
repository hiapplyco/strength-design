
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: Array<{
    id: string;
    message: string;
    response?: string | null;
    file_path?: string | null;
    created_at: string;
  }>;
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1 px-4">
      <div className="space-y-6 py-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            response={msg.response}
            file_path={msg.file_path}
            created_at={msg.created_at}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
