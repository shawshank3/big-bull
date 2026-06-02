import { FloatingChatbot } from '../chat';
import { MainLayout } from './MainLayout';
import { PageShell } from './PageShell';

export const AppPageLayout = ({ children, showChatbot = false }) => {
  return (
    <MainLayout>
      <PageShell>{children}</PageShell>
      {showChatbot ? <FloatingChatbot /> : null}
    </MainLayout>
  );
};

export default AppPageLayout;
