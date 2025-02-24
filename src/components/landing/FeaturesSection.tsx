
import { BarChart, Brain, Users, Scale } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-black/60 backdrop-blur-sm rounded-3xl px-4 md:px-6 lg:px-12 mx-4 md:mx-6 lg:mx-12 mt-12 border border-white/5">
      <div className="text-center mb-16 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-collegiate text-destructive mb-4 transform -skew-x-12 uppercase tracking-wider break-words">
          strength.design
        </h2>
        <p className="text-base md:text-lg text-white px-2">
          Combine cutting-edge exercise science with intuitive software to build programs your members will love
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        <div className="text-center space-y-4 px-4 transition-all duration-300 hover:transform hover:scale-105">
          <BarChart className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto" />
          <h3 className="text-xl md:text-2xl font-oswald text-primary">Data-Driven Programming</h3>
          <p className="text-sm md:text-base text-white">Leverage advanced algorithms and real-time metrics to optimize strength gains.</p>
        </div>
        <div className="text-center space-y-4 px-4 transition-all duration-300 hover:transform hover:scale-105">
          <Brain className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto" />
          <h3 className="text-xl md:text-2xl font-oswald text-primary">Science-Backed Methods</h3>
          <p className="text-sm md:text-base text-white">Every routine is rooted in the latest research on exercise physiology and biomechanics.</p>
        </div>
        <div className="text-center space-y-4 px-4 transition-all duration-300 hover:transform hover:scale-105">
          <Users className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto" />
          <h3 className="text-xl md:text-2xl font-oswald text-primary">Customizable Workouts</h3>
          <p className="text-sm md:text-base text-white">Craft individualized programs for different fitness levels from beginners to elite athletes.</p>
        </div>
        <div className="text-center space-y-4 px-4 transition-all duration-300 hover:transform hover:scale-105">
          <Scale className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto" />
          <h3 className="text-xl md:text-2xl font-oswald text-primary">Scalable Solutions</h3>
          <p className="text-sm md:text-base text-white">Easily expand your programs to serve entire gyms, teams, or online communities.</p>
        </div>
      </div>
    </section>
  );
};
