
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Zap, Loader2, MessageSquareOff, RotateCcw } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useSmartChat } from '@/hooks/useSmartChat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface WorkoutChatContainerProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export const WorkoutChatContainer: React.FC<WorkoutChatContainerProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [input, setInput] = useState('');
  const { config, clearConfig, getConfigSummary } = useWorkoutConfig();
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

    // Check for end chat keywords
    if (message.toLowerCase().includes('end chat') || 
        message.toLowerCase().includes('finish chat') ||
        message.toLowerCase().includes('complete chat') ||
        message.toLowerCase().includes('done chatting')) {
      handleEndChat();
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
      case '/reset':
        handleClearAll();
        break;
      case '/end':
      case '/finish':
      case '/complete':
        handleEndChat();
        break;
      case '/help':
        sendMessage('Available commands: /generate (create workout), /clear (reset everything), /end (finish chat), /help (this message)');
        break;
      default:
        sendMessage(`I don't recognize the command "${command}". Try /help for available commands or just chat normally!`);
    }
  };

  const handleEndChat = () => {
    const summary = getConfigSummary();
    const endMessage = `Great! I've helped you configure your workout. Here's what we've set up:\n\n${summary}\n\nYou can now generate your workout or continue chatting if you need any adjustments!`;
    
    // Add the summary message to chat
    const summaryMsg = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: endMessage,
      timestamp: new Date()
    };
    
    // This would need to be added to the useSmartChat hook to support adding messages directly
    sendMessage('Please provide a summary of our conversation and the workout configuration we\'ve created.');
  };

  const handleClearAll = () => {
    clearConfig();
    clearChat();
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
    <Card className="h-full flex flex-col bg-background/95 backdrop-blur border-border/50 shadow-lg">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            AI Workout Coach
          </CardTitle>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MessageSquareOff className="h-4 w-4" />
                  End Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Chat Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you satisfied with your workout configuration? I can provide a summary of what we've set up together.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Chatting</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndChat}>
                    Yes, End Chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Everything</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear both the chat conversation and all workout configuration. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Yes, Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-12' 
                      : 'bg-muted text-muted-foreground mr-12'
                  }`}>
                    <div className="flex items-start gap-3">
                      {message.role === 'assistant' && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                    {message.configUpdates && Object.keys(message.configUpdates).length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 text-xs bg-primary/20 text-primary-foreground px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        Configuration updated
                      </motion.div>
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
                <div className="bg-muted text-muted-foreground rounded-lg p-4 max-w-[80%] mr-12">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t border-border/50 p-6 space-y-4">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your workout preferences..."
              className="flex-1 text-base"
              disabled={isLoading || isGenerating}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isLoading || isGenerating}
              size="icon"
              className="h-10 w-10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Button 
              onClick={onGenerate}
              disabled={isGenerating || !isFormComplete()}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12"
            >
              <Zap className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generating Your Workout...' : 'Generate My Workout'}
            </Button>
            
            {!isFormComplete() && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Chat with me to set up your fitness level and goals first
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
