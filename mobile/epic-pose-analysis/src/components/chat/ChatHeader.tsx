
import { MessageSquare, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onNewChat: () => void;
  onDeleteChat: () => void;
}

export const ChatHeader = ({ onNewChat, onDeleteChat }: ChatHeaderProps) => {
  return (
    <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Program Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={onNewChat}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={onDeleteChat}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
