import { Users, BarChart, Globe } from "lucide-react";

export const SolutionsSection = () => {
  return (
    <section className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-oswald text-primary mb-4 italic">
          The Ultimate Platform for Coaches
        </h2>
        <p className="text-lg text-destructive">
          Apply Your Strength combines the science of periodization with the flexibility of a modern coaching platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="bg-card p-8 rounded-xl space-y-4">
          <Users className="w-12 h-12 text-primary" />
          <h3 className="text-2xl font-oswald text-primary italic">Connect with Athletes</h3>
          <p className="text-white">Real-time chat, form review, and leaderboards to engage clients.</p>
        </div>
        <div className="bg-card p-8 rounded-xl space-y-4">
          <BarChart className="w-12 h-12 text-primary" />
          <h3 className="text-2xl font-oswald text-primary italic">Build Your Program</h3>
          <p className="text-white">Design scalable training plans and save time with reusable templates.</p>
        </div>
        <div className="bg-card p-8 rounded-xl space-y-4">
          <Globe className="w-12 h-12 text-primary" />
          <h3 className="text-2xl font-oswald text-primary italic">Grow Anywhere</h3>
          <p className="text-white">Sell your programs online or coach remotely from anywhere in the world.</p>
        </div>
      </div>
    </section>
  );
};