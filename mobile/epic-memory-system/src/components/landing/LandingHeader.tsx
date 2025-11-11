
import { Dumbbell } from "lucide-react";
import { ValuePropositionSection } from "./ValuePropositionSection";
import { MainCTASection } from "./MainCTASection";
import { spacing, text, layout, width } from "@/utils/responsive";

interface LandingHeaderProps {
  user: any;
  onAuth: () => void;
}

export const LandingHeader = ({ user, onAuth }: LandingHeaderProps) => {
  return (
    <div className={`${spacing.section} ${spacing.container} text-center ${layout.noOverflow}`}>
      <h1 className={`${text.title} font-bold text-primary`}>strength.design</h1>
      <p className={`${text.subtitle} text-foreground/80 ${width.content} mt-2`}>
        AI-powered tools to build dynamic workout programs, track your progress, and share your knowledge with the world.
      </p>
      
      <ValuePropositionSection />
      <MainCTASection user={user} onAuth={onAuth} />
    </div>
  );
};
