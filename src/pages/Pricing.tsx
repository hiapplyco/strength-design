import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative">
          <div className="container mx-auto px-4 pt-24">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
                upgrade.to.pro
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Unlock advanced features and unlimited access to our premium tools. Scale your training business with our professional suite of features.
              </p>
            </div>
            
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Free</h2>
          <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/month</span></p>
          <ul className="space-y-4 mb-8">
            <li>✓ Basic workout generation</li>
            <li>✓ 3 workouts per month</li>
            <li>✓ Basic exercise library</li>
          </ul>
          <button className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90">
            Get Started
          </button>
        </div>

        <div className="border rounded-lg p-8 shadow-lg bg-primary/5 border-primary">
          <h2 className="text-2xl font-bold mb-4">Pro</h2>
          <p className="text-3xl font-bold mb-6">$9.99<span className="text-sm font-normal">/month</span></p>
          <ul className="space-y-4 mb-8">
            <li>✓ Advanced workout generation</li>
            <li>✓ Unlimited workouts</li>
            <li>✓ Full exercise library</li>
            <li>✓ Progress tracking</li>
          </ul>
          <button className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90">
            Subscribe Now
          </button>
        </div>

        <div className="border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Enterprise</h2>
          <p className="text-3xl font-bold mb-6">Custom</p>
          <ul className="space-y-4 mb-8">
            <li>✓ Everything in Pro</li>
            <li>✓ Custom integrations</li>
            <li>✓ Dedicated support</li>
            <li>✓ Team management</li>
          </ul>
          <button className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-primary/90">
            Contact Sales
          </button>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
