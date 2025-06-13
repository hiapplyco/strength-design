import React, { useEffect } from 'react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { useSmartChat } from '@/hooks/useSmartChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessagesArea } from './ChatMessagesArea';
import { ChatInput } from './ChatInput';

interface WorkoutChatContainerProps {
  isGenerating: boolean;
}

export const WorkoutChatContainer: React.FC<WorkoutChatContainerProps> = ({
  isGenerating
}) => {
  const { config, clearConfig, getConfigSummary } = useWorkoutConfig();
  const { messages, isLoading, sendMessage, clearChat, initializeChat } = useSmartChat();

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleSendMessage = async (message: string) => {
    if (message.startsWith('/')) {
      handleCommand(message);
      return;
    }

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
    
    const summaryMsg = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: endMessage,
      timestamp: new Date()
    };
    
    sendMessage('Please provide a summary of our conversation and the workout configuration we\'ve created.');
  };

  const handleClearAll = () => {
    clearConfig();
    clearChat();
  };

  return (
    <div className="h-full w-full flex flex-col">
      <ChatHeader 
        onEndChat={handleEndChat}
        onClearAll={handleClearAll}
      />
      
      <div className="flex-1 w-full flex flex-col min-h-0">
        <ChatMessagesArea 
          messages={messages}
          isLoading={isLoading}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};
