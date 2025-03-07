
import React from 'react';
import { LogoHeader } from '@/components/ui/logo-header';

export const PageHeader = () => {
  return (
    <div className="text-center mb-16">
      <LogoHeader>previous.programs</LogoHeader>
      <p className="text-xl text-white/80 max-w-3xl mx-auto">
        Access and review your previously generated workout programs. Track your progress and adapt your training based on historical data.
      </p>
    </div>
  );
};
