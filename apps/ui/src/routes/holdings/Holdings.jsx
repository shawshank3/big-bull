import { HoldingsContent } from '../../components/holdings';
import { AppPageLayout } from '../../components/layout';

export const Holdings = () => {
  return (
    <AppPageLayout>
      <AppPageLayout.Content>
        <HoldingsContent />
      </AppPageLayout.Content>
    </AppPageLayout>
  );
};

export default Holdings;
