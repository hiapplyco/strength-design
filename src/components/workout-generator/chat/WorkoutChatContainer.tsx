
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Zap, Loader2 } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useSmartChat } from '@/hooks/useSmartChat';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutChatContainerProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export const WorkoutChatContainer: React.FC<WorkoutChatContainerProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [input, setInput] = useState('');
  const { config, clearConfig } = useWorkoutConfig();
  const { messages, isLoading, sendMessage, clearChat, initializeChat } = useSmartChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    // Handle special commands
    if (message.startsWith('/')) {
      handleCommand(message);
      return;
    }

    await sendMessage(message);
  };

  const handleCommand = (command: string) => {
    switch (command.toLowerCase()) {
      case '/generate':
        onGenerate();
        break;
      case '/clear':
        clearConfig();
        clearChat();
        break;
      case '/help':
        sendMessage('What commands are available and how can you help me?');
        break;
      default:
        sendMessage(`I don't recognize the command "${command}". Try asking me naturally about your workout preferences!`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isFormComplete = () => {
    return config.fitnessLevel && (
      config.prescribedExercises || 
      config.selectedExercises.length > 0
    );
  };

  return (
    <Card className="h-full flex flex-col bg-background/95 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI Workout Coach
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                    {message.configUpdates && Object.keys(message.configUpdates).length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        ✓ Updated configuration
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me about your fitness goals..."
              className="flex-1"
              disabled={isLoading || isGenerating}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isLoading || isGenerating}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Button 
            onClick={onGenerate}
            disabled={isGenerating || !isFormComplete()}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Workout...' : 'Generate My Workout'}
          </Button>
          
          {!isFormComplete() && (
            <p className="text-xs text-muted-foreground text-center">
              Chat with me to set up your fitness level and goals first
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
