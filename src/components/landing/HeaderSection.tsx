import { motion } from "framer-motion";

export const HeaderSection = () => {
  return (
    <div className="w-full bg-black/30 backdrop-blur-sm pt-24 pb-8">
      <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] max-w-3xl mx-auto">
        strength.design
      </h1>
    </div>
  );
};