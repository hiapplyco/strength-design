
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ProgramChat() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div 
        className="relative bg-cover bg-center bg-fixed flex-grow"
        style={{
          backgroundImage: 'url("/lovable-uploads/78a72fa4-f7a3-4bb0-b605-2eb06ed58258.png")',
          minHeight: '100vh'
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="container mx-auto px-4 py-8 relative">
          <ChatContainer />
        </div>
      </div>
    </div>
  );
}
