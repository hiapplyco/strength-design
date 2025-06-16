
import React from 'react';
import { JournalPage as JournalPageComponent } from '../components/journal/JournalPage';
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";

const JournalPageRoute: React.FC = () => {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${layout.noOverflow} ${spacing.section}`}>
        <JournalPageComponent />
      </div>
    </StandardPageLayout>
  );
};

export default JournalPageRoute;
