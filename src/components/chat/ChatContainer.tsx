
import { Card } from "@/components/ui/card";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSubscriptionManager } from "./ChatSubscriptionManager";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useEffect } from "react";

export const ChatContainer = () => {
  const {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    handleFileSelect
  } = useChatMessages();

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col h-[80vh]">
        <ChatSubscriptionManager onMessageUpdate={fetchMessages} />
        <ChatHeader />
        <ChatMessages messages={messages} />
        <ChatInput 
          onSendMessage={handleSendMessage}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
};
