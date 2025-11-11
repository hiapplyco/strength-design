
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";

export const UpgradeCTASection = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-8 text-center mb-12">
      <h2 className="text-2xl font-semibold text-amber-900 mb-3">
        Ready to Unlock Everything?
      </h2>
      <p className="text-amber-700 mb-4 max-w-2xl mx-auto">
        Start with 3 free workouts, then upgrade to Pro for just <strong>$25/month</strong> to access unlimited workout generation, nutrition tracking, AI coaching, and all advanced features.
      </p>
      <Button 
        onClick={() => navigate('/pricing')} 
        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
      >
        <Crown className="h-5 w-5 mr-2" />
        View Pricing Plans
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
};
