
import React from 'react';
import { JournalPage as JournalPageComponent } from '../components/journal/JournalPage';
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";

const JournalPageRoute: React.FC = () => {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${layout.noOverflow} ${spacing.section}`}>
        <ProFeatureWrapper featureName="Smart Journal">
          <JournalPageComponent />
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
};

export default JournalPageRoute;
