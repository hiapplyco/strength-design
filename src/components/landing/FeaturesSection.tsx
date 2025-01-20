import { BarChart, Brain, Users, Scale } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <div className="text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-collegiate text-destructive mb-4 transform -skew-x-12 uppercase tracking-wider">
          strength.design
        </h2>
        <p className="text-lg text-destructive">
          Combine cutting-edge exercise science with intuitive software to build programs your members will love
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="text-center space-y-4">
          <BarChart className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary">Data-Driven Programming</h3>
          <p className="text-white">Leverage advanced algorithms and real-time metrics to optimize strength gains.</p>
        </div>
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary">Science-Backed Methods</h3>
          <p className="text-white">Every routine is rooted in the latest research on exercise physiology and biomechanics.</p>
        </div>
        <div className="text-center space-y-4">
          <Users className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary">Customizable Workouts</h3>
          <p className="text-white">Craft individualized programs for different fitness levels from beginners to elite athletes.</p>
        </div>
        <div className="text-center space-y-4">
          <Scale className="w-16 h-16 text-primary mx-auto" />
          <h3 className="text-2xl font-oswald text-primary">Scalable Solutions</h3>
          <p className="text-white">Easily expand your programs to serve entire gyms, teams, or online communities.</p>
        </div>
      </div>
    </section>
  );
};