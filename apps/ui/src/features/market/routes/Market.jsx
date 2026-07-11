import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { PageMeta } from '@/shared/components/PageMeta';
import { SimBanner } from '@/shared/components/SimBanner';
import { MarketContent } from '../components';

export const Market = () => (
  <>
    <PageMeta
      title="Simulated Stock Market"
      description="Browse simulated stocks and mutual funds. Practice buying and selling in a realistic virtual market with simulated price movements."
      path="/market"
    />
    <AppPageLayout>
      <AppPageLayout.Content>
        <SimBanner className="mb-4" />
        <MarketContent />
      </AppPageLayout.Content>
    </AppPageLayout>
  </>
);

export default Market;
