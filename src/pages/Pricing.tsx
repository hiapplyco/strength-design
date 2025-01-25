import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black">
      <div className="container mx-auto px-4 pt-24">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl md:text-5xl font-oswald font-bold text-white mb-12 text-center">
          Choose Your Plan
        </h1>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-oswald font-bold text-white mb-4">Free</h2>
            <p className="text-gray-400 mb-6">Perfect for getting started</p>
            <p className="text-3xl font-bold text-white mb-8">$0<span className="text-lg font-normal text-gray-400">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="text-gray-300">✓ Basic workout generation</li>
              <li className="text-gray-300">✓ 3 workouts per month</li>
              <li className="text-gray-300">✓ Basic analytics</li>
            </ul>
            <Button className="w-full" variant="outline">
              Current Plan
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-900 p-8 rounded-lg border border-destructive transform scale-105">
            <h2 className="text-2xl font-oswald font-bold text-white mb-4">Pro</h2>
            <p className="text-gray-400 mb-6">For serious athletes</p>
            <p className="text-3xl font-bold text-white mb-8">$29<span className="text-lg font-normal text-gray-400">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="text-gray-300">✓ Advanced workout generation</li>
              <li className="text-gray-300">✓ Unlimited workouts</li>
              <li className="text-gray-300">✓ Advanced analytics</li>
              <li className="text-gray-300">✓ Priority support</li>
            </ul>
            <Button className="w-full bg-destructive hover:bg-destructive/90">
              Upgrade Now
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-oswald font-bold text-white mb-4">Enterprise</h2>
            <p className="text-gray-400 mb-6">For teams & organizations</p>
            <p className="text-3xl font-bold text-white mb-8">Custom</p>
            <ul className="space-y-4 mb-8">
              <li className="text-gray-300">✓ All Pro features</li>
              <li className="text-gray-300">✓ Custom integrations</li>
              <li className="text-gray-300">✓ Dedicated support</li>
              <li className="text-gray-300">✓ Team management</li>
            </ul>
            <Button className="w-full" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;