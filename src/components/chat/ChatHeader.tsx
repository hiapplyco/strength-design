import { MessageSquare } from "lucide-react";

export const ChatHeader = () => {
  return (
    <div className="p-4 border-b border-primary/20">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h1 className="text-xl font-semibold text-accent">Program Chat</h1>
      </div>
    </div>
  );
};