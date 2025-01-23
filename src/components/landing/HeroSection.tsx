import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection = ({
  children
}: HeroSectionProps) => {
  return (
    <section className="flex flex-col items-center justify-center space-y-8 pt-12 pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary">
          Intelligent Strength Programming
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto">
          Transform your training methodology with data-driven strength programs that adapt and scale. 
          Built for coaches who demand excellence and athletes who pursue it.
        </p>
      </div>

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
            <h3 className="text-xl font-oswald text-primary mb-2">Scientific Programming</h3>
            <p>Leverage exercise science and real-time metrics to optimize strength gains</p>
          </div>
          <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
            <h3 className="text-xl font-oswald text-primary mb-2">Personalized Focus</h3>
            <p>Tailor programs to individual goals, experience levels, and progression rates</p>
          </div>
          <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
            <h3 className="text-xl font-oswald text-primary mb-2">Scale Excellence</h3>
            <p>Efficiently manage multiple athletes while maintaining program quality</p>
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <div className="relative z-10 max-w-7xl mx-auto transform hover:scale-[0.99] transition-transform duration-200 border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-white/90 backdrop-blur-sm p-8 rounded-xl mt-8">
          {children}
        </div>
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="animate-bounce"
        onClick={() => {
          const element = document.getElementById('features');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <ArrowDown className="h-4 w-4 mr-2" />
        Learn More
      </Button>
    </section>
  );
};