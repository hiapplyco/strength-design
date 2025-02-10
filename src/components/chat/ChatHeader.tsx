
import { MessageSquare } from "lucide-react";

export const ChatHeader = () => {
  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Program Chat</h1>
        </div>
      </div>
    </div>
  );
};
