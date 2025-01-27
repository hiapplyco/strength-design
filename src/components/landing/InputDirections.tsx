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
      <h3 className="text-xl font-oswald text-accent mb-4 text-center">Input Order:</h3>
      <ul className="list-none space-y-3">
        <li className="flex items-center text-white">
          <NumberedCircle number={1} />
          <span className="ml-3">Location - Weather affects your performance</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={2} />
          <span className="ml-3">Search Exercises & Equipment - Define your available resources</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={3} />
          <span className="ml-3">Fitness Level - Tailored to your capabilities</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={4} />
          <span className="ml-3">Prescribed Exercises - Upload images/PDFs of required movements</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={5} />
          <span className="ml-3">Injuries & Limitations - Ensures safe, appropriate programming</span>
        </li>
        <li className="flex items-center text-white">
          <NumberedCircle number={6} />
          <span className="ml-3">Training Days - Design your perfect training cycle</span>
        </li>
      </ul>
    </div>
  );
};