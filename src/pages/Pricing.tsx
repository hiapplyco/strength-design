export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Pricing Plans</h1>
        <p className="text-xl mb-12">Choose the plan that best fits your needs</p>
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
  );
}