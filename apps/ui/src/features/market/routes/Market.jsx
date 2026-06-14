import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { MarketContent } from '../components';

export const Market = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <MarketContent />
    </AppPageLayout.Content>
  </AppPageLayout>
);

export default Market;
