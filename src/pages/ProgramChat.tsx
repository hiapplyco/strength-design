
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ProgramChat() {
  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="py-6 px-4 container mx-auto text-center flex-shrink-0">
        <h1 className="text-3xl font-bold text-primary">program.chat</h1>
        <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-2">
          Your personal coach. Chat about fitness, nutrition, or upload training materials for expert guidance.
        </p>
      </header>
      <main className="flex-grow container mx-auto px-4 pb-4 min-h-0">
        <ChatContainer />
      </main>
    </div>
  );
}
