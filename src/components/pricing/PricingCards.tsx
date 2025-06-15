
import React from "react";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";

export function PricingCards() {
  const { workoutUsage, isLoading } = useWorkoutUsage();

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
      {/* Free Plan Card */}
      <div className="max-w-sm w-full bg-card border rounded-xl shadow-md p-8 flex flex-col items-center text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">Your Journey Starts Here</h3>
        <p className="text-foreground/80 mb-4 min-h-[40px]">
          Begin your transformation with our core features. See what's possible when your training is powered by AI.
        </p>
        <div className="text-4xl font-extrabold text-green-700 mb-2">FREE</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">For your first 3 workouts</div>
        {/* Usage Tally */}
        <div className="mb-4 w-full min-h-[20px]">
          {isLoading || !workoutUsage ? (
            <span className="text-sm text-muted-foreground">Checking usage...</span>
          ) : (
            <span className={`text-sm font-semibold 
              ${workoutUsage.free_workouts_remaining === 0 ? "text-red-600" : "text-green-700"}`}>
              {workoutUsage.free_workouts_remaining} of 3 free workouts left
            </span>
          )}
        </div>
        <ul className="mb-6 text-sm text-foreground/80 text-left space-y-2">
          <li>✔️ AI-Powered Workout Generator (3 uses)</li>
          <li>✔️ Discover your potential, on us</li>
          <li>✔️ No commitment, all motivation</li>
        </ul>
      </div>
      {/* Pro Plan Card */}
      <div className="relative max-w-sm w-full bg-card border-2 border-primary shadow-xl rounded-xl p-8 flex flex-col items-center scale-105 text-center">
        <div className="absolute top-0 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold rounded-full">
          Most Popular
        </div>
        <h3 className="text-2xl font-bold text-primary mb-2">Unleash Your Potential</h3>
        <p className="text-foreground/80 mb-4 min-h-[40px]">
          Commit to your growth with unlimited access, exclusive features, and direct support from the team that built this for you.
        </p>
        <div className="text-4xl font-extrabold text-purple-700 mb-2">$24.99</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">per month</div>
        <ul className="mb-6 text-sm text-foreground/80 text-left space-y-2">
          <li>✔️ <strong>Unlimited</strong> AI workout generation</li>
          <li>✔️ Access to <strong>all</strong> advanced features</li>
          <li>✔️ Directly support our mission & development</li>
        </ul>
      </div>
    </div>
  );
}
