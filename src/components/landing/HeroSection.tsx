import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { ContactDialog } from "./ContactDialog";

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection = ({ children }: HeroSectionProps) => {
  return (
    <section className="flex flex-col items-center space-y-8 pt-12 pb-20" aria-label="Scientific Strength Programming Platform">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-oswald text-primary dark:text-white">
          Evidence-Based Strength Programming
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-800 dark:text-gray-200">
          Transform athlete performance with data-driven strength programs built on exercise science.
          Scale from individual training to managing thousands of athletes while maintaining scientific rigor and personalization.
        </p>

        <div className="mt-12 max-w-2xl mx-auto px-4">
          <div className="bg-black/90 border-2 border-destructive rounded-xl p-8 backdrop-blur-sm transform hover:scale-[1.02] transition-all">
            <div className="inline-block bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold mb-4">
              Limited Time Offer
            </div>
            <h3 className="text-2xl md:text-3xl font-oswald text-white mb-4">
              Try Our AI Workout Generator Free
            </h3>
            <p className="text-gray-300 mb-6">
              Experience enterprise-grade programming technology. Generate custom workouts powered by exercise science - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => document.getElementById('workout-generator')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-oswald text-lg px-8 py-6"
              >
                Generate Free Workout
              </Button>
              <ContactDialog buttonText="Schedule a Demo" variant="outline" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
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
            <p className="text-gray-800 dark:text-gray-200">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 w-full max-w-3xl">
        {[
          {
            number: 1,
            title: "Systematic Training Analysis",
            desc: "Our algorithm analyzes training environments, equipment availability, and facility constraints to optimize program design for any training context - from home gyms to commercial facilities.",
            color: "primary"
          },
          {
            number: 2,
            title: "Evidence-Based Programming",
            desc: "Programs incorporate validated training principles including volume landmarks, intensity distribution, and fatigue management protocols. Each program adapts to individual recovery capacity and progression rates.",
            color: "secondary"
          },
          {
            number: 3,
            title: "Automated Periodization",
            desc: "Scientific load management with automatic deload scheduling, volume progression, and intensity distribution based on research-validated training principles and real-time performance data.",
            color: "accent"
          }
        ].map((item, i) => (
          <div key={i} className="flex items-start space-x-4 p-6 bg-black/80 rounded-lg border-2 border-[var(--${item.color})]">
            <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-${item.color} text-white font-bold text-xl`}>
              {item.number}
            </div>
            <div>
              <h3 className={`text-xl font-oswald text-${item.color} dark:text-white mb-2`}>{item.title}</h3>
              <p className="text-gray-800 dark:text-gray-300">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-3xl">
        {children}
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="text-gray-800 dark:text-white animate-bounce"
        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ArrowDown className="h-4 w-4 mr-2" />
        Explore Scientific Programming
      </Button>
    </section>
  );
};
