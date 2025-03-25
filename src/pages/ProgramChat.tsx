
import { ChatContainer } from "@/components/chat/ChatContainer";
import { LogoHeader } from "@/components/ui/logo-header";

export default function ProgramChat() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 pt-24 pb-8 relative">
        <div className="text-center mb-16">
          <LogoHeader>program.chat</LogoHeader>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Your personal coach for building your own gym. Chat about the CrossFit Affiliate Playbook or upload your own training materials to get expert guidance and answers to all your questions.
          </p>
        </div>
        <ChatContainer />
      </div>
    </div>
  );
}
