
import { Circle } from "lucide-react";
import { InfoIcon } from "lucide-react";

const NumberedCircle = ({ number }: { number: number }) => (
  <div className="relative w-6 h-6 text-accent">
    <Circle className="w-6 h-6" />
    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
      {number}
    </span>
  </div>
);

export const InputDirections = () => {
  return (
    <div className="max-w-3xl mx-auto text-left space-y-2 bg-white/5 p-6 rounded-lg border border-white/10">
      <h3 className="text-xl font-oswald text-accent mb-4">How It Works:</h3>
      
      <div className="mb-4">
        <p className="text-white/80 mb-3">
          Our AI will create a personalized training program based on your input. Simply fill in the form below with your preferences.
        </p>
        <div className="flex items-center gap-2 text-primary text-sm bg-black/40 p-3 rounded-md">
          <InfoIcon className="w-4 h-4 flex-shrink-0" />
          <p>Program generation typically takes about 30 seconds to complete.</p>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-accent/90 mb-2">Quick Steps:</h4>
        <ul className="list-none space-y-2">
          <li className="flex items-start text-white/80">
            <NumberedCircle number={1} />
            <span className="ml-3">Enter your location & exercise preferences</span>
          </li>
          <li className="flex items-start text-white/80">
            <NumberedCircle number={2} />
            <span className="ml-3">Select your fitness level & upload optional exercises</span>
          </li>
          <li className="flex items-start text-white/80">
            <NumberedCircle number={3} />
            <span className="ml-3">Note any injuries & set your training duration</span>
          </li>
          <li className="flex items-start text-white/80">
            <NumberedCircle number={4} />
            <span className="ml-3">Click "Generate" and we'll create your custom program</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
