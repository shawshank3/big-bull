import { DashboardContent } from '../../components/dashboard';
import { AppPageLayout } from '../../components/layout';

export const Dashboard = () => {
  return (
    <AppPageLayout showChatbot>
      <DashboardContent />
    </AppPageLayout>
  );
};

export default Dashboard;
