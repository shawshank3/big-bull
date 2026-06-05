import { DashboardContent } from '../../components/dashboard';
import { AppPageLayout } from '../../components/layout';

export const Dashboard = () => {
  return (
    <AppPageLayout>
      <AppPageLayout.Content>
        <DashboardContent />
      </AppPageLayout.Content>
      <AppPageLayout.Chatbot />
    </AppPageLayout>
  );
};

export default Dashboard;
