import { Star } from "lucide-react";

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-card rounded-3xl px-6 md:px-12">
      <h2 className="text-4xl md:text-5xl font-oswald text-primary text-center mb-16 italic">
        What Coaches Are Saying
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-muted p-8 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-primary fill-current" />
            ))}
          </div>
          <p className="text-white mb-4">"Apply Your Strength changed how I coach my athletes—streamlined, efficient, and easy to use!"</p>
          <p className="text-primary font-oswald">– Jane D.</p>
        </div>
        <div className="bg-muted p-8 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            {[1,2,3,4,5].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-primary fill-current" />
            ))}
          </div>
          <p className="text-white mb-4">"The analytics give me the edge I need to refine my programming and keep my clients progressing."</p>
          <p className="text-primary font-oswald">– John S.</p>
        </div>
      </div>
    </section>
  );
};