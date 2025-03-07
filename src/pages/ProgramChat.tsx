
import { ChatContainer } from "@/components/chat/ChatContainer";
import { LogoHeader } from "@/components/ui/logo-header";
import { StyledLogo } from "@/components/ui/styled-logo";

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
        
        <div className="container mx-auto px-4 pt-24 pb-8 relative">
          <div className="text-center mb-16">
            <StyledLogo size="large" className="mb-4" />
            <LogoHeader>program.chat</LogoHeader>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Your personal coach for building your own gym. Chat about the CrossFit Affiliate Playbook or upload your own training materials to get expert guidance and answers to all your questions.
            </p>
          </div>
          <ChatContainer />
        </div>
      </div>
    </div>
  );
}
