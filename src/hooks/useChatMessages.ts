
import { useMessageHandling } from "./useMessageHandling";
import { useFileUpload } from "./useFileUpload";

export const useChatMessages = () => {
  const { 
    messages, 
    isLoading: messageLoading, 
    fetchMessages, 
    handleSendMessage 
  } = useMessageHandling();

  const { 
    isLoading: fileLoading, 
    handleFileSelect 
  } = useFileUpload();

  return {
    messages,
    isLoading: messageLoading || fileLoading,
    fetchMessages,
    handleSendMessage,
    handleFileSelect
  };
};
