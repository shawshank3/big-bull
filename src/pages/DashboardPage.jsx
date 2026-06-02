import { DashboardContent } from '../components/dashboard';
import { AppPageLayout } from '../components/layout';

export const DashboardPage = () => {
  return (
    <AppPageLayout showChatbot>
      <DashboardContent />
    </AppPageLayout>
  );
};

export default DashboardPage;
