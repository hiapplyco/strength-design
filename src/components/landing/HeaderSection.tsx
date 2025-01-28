import { motion } from "framer-motion";

export const HeaderSection = () => {
  return (
    <div className="w-full pt-24 pb-8 relative">
      {/* Smoother gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-black/20 to-black/60 backdrop-blur-[8px] pointer-events-none" />
      
      <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] max-w-3xl mx-auto backdrop-blur-sm relative z-10">
        strength.design
      </h1>
    </div>
  );
};