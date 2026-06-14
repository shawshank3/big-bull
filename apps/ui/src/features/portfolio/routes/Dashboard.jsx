import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { DashboardContent } from '../components';

export const Dashboard = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <DashboardContent />
    </AppPageLayout.Content>
    <AppPageLayout.Chatbot />
  </AppPageLayout>
);

export default Dashboard;
