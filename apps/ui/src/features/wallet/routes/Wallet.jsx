import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { WalletContent } from '../components';

export const Wallet = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <WalletContent />
    </AppPageLayout.Content>
    <AppPageLayout.Chatbot />
  </AppPageLayout>
);

export default Wallet;
