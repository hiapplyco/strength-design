import { Circle } from "lucide-react";

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
    <div className="mt-8 max-w-2xl mx-auto text-left space-y-2 bg-white/5 p-6 rounded-lg">
      <h3 className="text-xl font-oswald text-accent mb-4">Program Generation Steps:</h3>
      <ul className="list-none space-y-3">
        <li className="flex items-center text-white">
          <NumberedCircle number={1} />
          <span className="ml-3">Location & Weather Conditions</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={2} />
          <span className="ml-3">Available Equipment & Exercises</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={3} />
          <span className="ml-3">Current Fitness Level</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={4} />
          <span className="ml-3">Required Movements (Images/PDFs)</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={5} />
          <span className="ml-3">Injuries & Limitations</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={6} />
          <span className="ml-3">Training Cycle Duration</span>
        </li>
      </ul>
    </div>
  );
};