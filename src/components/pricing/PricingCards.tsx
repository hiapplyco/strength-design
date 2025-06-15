
import React from "react";

export function PricingCards() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="max-w-xl w-full bg-card border rounded-xl shadow-sm p-8 flex flex-col items-center">
        <h3 className="text-xl font-semibold text-primary mb-2">Pro Plan (Preview)</h3>
        <p className="text-foreground/80 mb-4">
          Unlimited workout generations, advanced tools, and AI support.
        </p>
        <div className="text-3xl font-bold text-green-600 mb-3">$14</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">per month</div>
        {/* You can add more feature listing here */}
        <ul className="mb-6 text-sm text-foreground/80 text-left">
          <li>✔️ Unlimited access to the workout generator</li>
          <li>✔️ Priority access to new features</li>
          <li>✔️ Support the development of the app!</li>
        </ul>
      </div>
    </div>
  );
}

