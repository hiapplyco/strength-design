
import { Sparkles } from "lucide-react";

export const ValuePropositionSection = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6 mb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-blue-900">Start Your Transformation Today</h2>
      </div>
      <p className="text-blue-700 mb-4">
        Get <strong>3 FREE AI-powered workout programs</strong> worth up to a month of specialized training, 
        tailored specifically for your goals and equipment.
      </p>
      <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
        <span>✓ Professional-grade programming</span>
        <span>✓ Personalized to your level</span>
        <span>✓ No credit card required</span>
      </div>
    </div>
  );
};
