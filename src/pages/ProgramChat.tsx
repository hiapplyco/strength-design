
import { ChatContainer } from "@/components/chat/ChatContainer";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, layout } from "@/utils/responsive";

export default function ProgramChat() {
  const header = (
    <div className={`${spacing.section} ${spacing.container} text-center ${layout.noOverflow}`}>
      <h1 className={`${text.title} font-bold text-primary`}>program.chat</h1>
      <p className={`${text.subtitle} text-foreground/80 ${width.content} mt-2`}>
        Your personal coach. Chat about fitness, nutrition, or upload training materials for expert guidance.
      </p>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        <ChatContainer />
      </div>
    </StandardPageLayout>
  );
}
