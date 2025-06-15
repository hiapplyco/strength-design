
import React from 'react';
import { JournalPage as JournalPageComponent } from '../components/journal/JournalPage';
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

const JournalPageRoute: React.FC = () => {
  return (
    <StandardPageLayout>
      <JournalPageComponent />
    </StandardPageLayout>
  );
};

export default JournalPageRoute;
