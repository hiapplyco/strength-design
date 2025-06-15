
import React from "react";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";

export function PricingCards() {
  const { workoutUsage, isLoading } = useWorkoutUsage();

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
      {/* Free Plan Card */}
      <div className="max-w-xs w-full bg-card border rounded-xl shadow-sm p-8 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-primary mb-2">Free Plan</h3>
        <p className="text-foreground/80 mb-4 text-center">
          Try out the app and generate up to
          <span className="font-bold text-primary"> 3 workouts for free.</span>
        </p>
        <div className="text-3xl font-bold text-green-700 mb-3">FREE</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">first 3 workouts</div>
        {/* Usage Tally */}
        <div className="mb-4 w-full">
          {isLoading || !workoutUsage ? (
            <span className="text-sm text-muted-foreground">Checking usage...</span>
          ) : (
            <span className={`text-sm font-semibold 
              ${workoutUsage.free_workouts_remaining === 0 ? "text-red-600" : "text-green-700"}`}>
              {workoutUsage.free_workouts_remaining} of 3 free workouts left
            </span>
          )}
        </div>
        <ul className="mb-6 text-sm text-foreground/80 text-left">
          <li>✔️ Access workout generator (limit: 3)</li>
          <li>✔️ Try out all standard features</li>
          <li>✔️ No credit card required</li>
        </ul>
      </div>
      {/* Pro Plan Card */}
      <div className="max-w-xs w-full bg-card border-2 border-primary shadow-lg rounded-xl p-8 flex flex-col items-center scale-105">
        <h3 className="text-lg font-semibold text-primary mb-2">Pro Plan</h3>
        <p className="text-foreground/80 mb-4 text-center">
          Unlimited workout generations, advanced features, and AI support.
        </p>
        <div className="text-3xl font-bold text-purple-700 mb-3">$24.99</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">per month</div>
        <ul className="mb-6 text-sm text-foreground/80 text-left">
          <li>✔️ Unlimited workout generation</li>
          <li>✔️ Priority access to new features</li>
          <li>✔️ Support the development of the app!</li>
        </ul>
      </div>
    </div>
  );
}

