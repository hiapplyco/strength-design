
import React from 'react';
import { JournalPage as JournalPageComponent } from '../components/journal/JournalPage';
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

const JournalPageRoute: React.FC = () => {
  return (
    <StandardPageLayout
      header={
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Smart Journal</h1>
          <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-2">
            Log workouts, notes, and see your fitness timeline.
          </p>
        </div>
      }
    >
      <JournalPageComponent />
    </StandardPageLayout>
  );
};

export default JournalPageRoute;
