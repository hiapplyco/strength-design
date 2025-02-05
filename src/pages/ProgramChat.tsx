import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send, Upload } from "lucide-react";

export default function ProgramChat() {
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will implement chat functionality in next step
    setMessage("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto bg-background/5 border border-primary/20 backdrop-blur-sm">
        <div className="flex flex-col h-[80vh]">
          {/* Chat Header */}
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-semibold text-accent">Program Chat</h1>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Messages will be implemented in next step */}
              <div className="bg-accent/5 rounded-lg p-4">
                <p className="text-accent">
                  Hello! I'm your AI assistant. Upload a file or ask me a question about programming.
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* File Upload Button */}
          <div className="px-4 py-2 border-t border-primary/20">
            <Button
              variant="outline"
              className="w-full mb-2"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-primary/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}