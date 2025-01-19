import { GraduationCap, Trophy, BookOpen } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4 italic">
          Train Smarter, Not Harder
        </h2>
        <p className="text-lg text-destructive">
          From customized programming to tracking progress, Apply Your Strength is the toolset you need.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="text-center space-y-4">
          <GraduationCap className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary italic">Adaptive Programming</h3>
          <p className="text-white">Precision-crafted plans tailored to your athletes' goals.</p>
        </div>
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary italic">Performance Analytics</h3>
          <p className="text-white">Data-driven insights to drive smarter decisions.</p>
        </div>
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary italic">Strategic Progression</h3>
          <p className="text-white">Build lasting results through structured periodization.</p>
        </div>
      </div>
    </section>
  );
};