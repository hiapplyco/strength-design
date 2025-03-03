
import React from 'react';

export const PageHeader = () => {
  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(0,112,243,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
        previous.programs
      </h1>
      <p className="text-xl text-white/80 max-w-3xl mx-auto">
        Access and review your previously generated workout programs. Track your progress and adapt your training based on historical data.
      </p>
    </div>
  );
};
