import { Button } from "@/components/ui/button";
import { ContactDialog } from "./ContactDialog";
import { VideoSection } from "./VideoSection";

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection = ({ children }: HeroSectionProps) => {
  const scrollToInput = () => {
    const element = document.getElementById('input-directions');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <section className="flex flex-col items-center space-y-8 pt-12 pb-20 w-full" aria-label="Scientific Strength Programming Platform">
      <div className="text-center space-y-4 w-full px-4">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary dark:text-white">
          Evidence-Based Strength Programming
        </h1>
        <p className="text-lg md:text-xl mx-auto text-white max-w-4xl">
          Transform athlete performance with data-driven strength programs built on exercise science.
          Scale from individual training to managing thousands of athletes while maintaining scientific rigor and personalization.
        </p>

        <VideoSection />

        <div className="mt-12 max-w-2xl mx-auto px-4">
          <div className="bg-black/90 border-2 border-destructive rounded-xl p-8 backdrop-blur-sm transform hover:scale-[1.02] transition-all">
            <div className="inline-block bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold mb-4">
              Limited Time Offer
            </div>
            <h3 className="text-2xl md:text-3xl font-oswald text-white mb-4">
              Try Our Evidence-Based Programming Free
            </h3>
            <p className="text-white mb-6">
              Experience enterprise-grade programming technology. Generate custom workouts powered by exercise science - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={scrollToInput}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-oswald text-lg px-8 py-6"
              >
                Generate Free Workout
              </Button>
              <ContactDialog buttonText="Schedule a Demo" variant="outline" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl px-4">
        {[
          {
            title: "Research-Backed Methodology",
            desc: "Programs built on peer-reviewed research in periodization, progressive overload, and performance optimization"
          },
          {
            title: "Data-Driven Progress",
            desc: "Track key performance indicators including volume load, relative intensity, and rate of perceived exertion (RPE)"
          },
          {
            title: "Enterprise Scalability",
            desc: "Manage thousands of athlete profiles with automated progress tracking and program adjustments"
          }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
            <h3 className="text-xl font-oswald text-primary dark:text-white mb-2">{item.title}</h3>
            <p className="text-white">{item.desc}</p>
          </div>
        ))}
      </div>

      {children}
    </section>
  );
};