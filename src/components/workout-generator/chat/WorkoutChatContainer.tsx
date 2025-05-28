
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Zap } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  config?: any;
}

interface WorkoutChatContainerProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export const WorkoutChatContainer: React.FC<WorkoutChatContainerProps> = ({
  onGenerate,
  isGenerating
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { config, getConfigSummary } = useWorkoutConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add initial welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you create the perfect workout. Tell me about your fitness goals, available equipment, or any limitations you have. You can also use commands like '/generate' to create your workout or '/clear' to start over.",
        timestamp: new Date()
      }]);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Handle commands
    if (input.startsWith('/')) {
      handleCommand(input);
      setIsTyping(false);
      return;
    }

    // Simulate AI response with current config context
    setTimeout(() => {
      const configSummary = getConfigSummary();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input, configSummary),
        timestamp: new Date(),
        config: config
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleCommand = (command: string) => {
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    switch (command.toLowerCase()) {
      case '/generate':
        assistantMessage.content = "Great! Let me generate your workout based on your current configuration. Click the generate button or I can do it for you!";
        setTimeout(() => onGenerate(), 1000);
        break;
      case '/clear':
        assistantMessage.content = "I've cleared your configuration. Let's start fresh! What kind of workout are you looking for?";
        break;
      case '/config':
        assistantMessage.content = `Here's your current configuration:\n\n${getConfigSummary()}`;
        break;
      default:
        assistantMessage.content = "Available commands:\n/generate - Create your workout\n/clear - Reset configuration\n/config - Show current settings";
    }

    setMessages(prev => [...prev, assistantMessage]);
  };

  const generateResponse = (userInput: string, configSummary: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('beginner') || input.includes('new to') || input.includes('starting out')) {
      return "Perfect! I see you're starting your fitness journey. I'd recommend setting your fitness level to 'Beginner' and starting with 3-4 days per week. Would you like me to suggest some beginner-friendly exercises?";
    }
    
    if (input.includes('strength') || input.includes('muscle') || input.includes('lifting')) {
      return "Great choice! Strength training is excellent for building muscle and bone density. Do you have access to weights or dumbbells? I can create a program that works with your available equipment.";
    }
    
    if (input.includes('cardio') || input.includes('running') || input.includes('endurance')) {
      return "Cardio is fantastic for heart health and endurance! Are you looking for indoor or outdoor workouts? I can factor in weather conditions if you're planning outdoor activities.";
    }
    
    if (input.includes('injury') || input.includes('pain') || input.includes('limitation')) {
      return "I understand you have some physical considerations. It's important to work around limitations safely. Can you tell me more about the specific areas I should modify exercises for?";
    }
    
    return `Thanks for that information! Based on what you've told me and your current configuration:\n\n${configSummary}\n\nIs there anything else you'd like to adjust before we generate your workout?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-background/95 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Workout Assistant
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
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
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
              placeholder="Ask me about your workout goals, equipment, or type /generate..."
              className="flex-1"
              disabled={isGenerating}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isGenerating}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Workout...' : 'Generate My Workout'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
