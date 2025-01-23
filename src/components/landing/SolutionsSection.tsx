import { Users, Building2, PersonStanding } from "lucide-react";

export const SolutionsSection = () => {
  return (
    <section className="py-20 relative">
      <div className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4">
            Designed for Trainers, Coaches and Enthusiasts Alike
          </h2>
          <p className="text-lg text-gray-800 dark:text-white">
            Our platform helps you deliver personalized strength programs anywhere, anytime
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-card/30 backdrop-blur-sm p-8 rounded-xl space-y-4 border border-white/10">
            <Users className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary">Coaches & Trainers</h3>
            <p className="text-gray-800 dark:text-white">Efficiently manage multiple clients, analyze progress, and adapt workouts in real-time.</p>
          </div>
          <div className="bg-card/30 backdrop-blur-sm p-8 rounded-xl space-y-4 border border-white/10">
            <Building2 className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary">Group Fitness & Gyms</h3>
            <p className="text-gray-800 dark:text-white">Scale personalized programs to all of your participants, providing dynamic dashboards and progress tracking.</p>
          </div>
          <div className="bg-card/30 backdrop-blur-sm p-8 rounded-xl space-y-4 border border-white/10">
            <PersonStanding className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary">Fitness Enthusiasts</h3>
            <p className="text-gray-800 dark:text-white">Take the guesswork out of training with expertly crafted plans tailored to your goals.</p>
          </div>
        </div>
      </div>
    </section>
  );
};