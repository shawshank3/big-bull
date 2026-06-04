import { FloatingChatbot } from '../chat';
import { PageShell } from './PageShell';

// Compound component approach - compose features instead of props
const Content = ({ children }) => <PageShell>{children}</PageShell>;

const Chatbot = () => <FloatingChatbot />;

export const AppPageLayout = ({ children }) => {
  return <>{children}</>;
};

// Attach compound components
AppPageLayout.Content = Content;
AppPageLayout.Chatbot = Chatbot;

export default AppPageLayout;
