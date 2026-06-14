import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { StockDetailContent } from '../components';

export const StockDetail = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <StockDetailContent />
    </AppPageLayout.Content>
  </AppPageLayout>
);

export default StockDetail;
