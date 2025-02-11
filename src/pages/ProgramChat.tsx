
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
        
        <div className="container mx-auto px-4 pt-24 pb-8 relative">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
              program.chat
            </h1>
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
