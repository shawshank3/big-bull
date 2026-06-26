import { FloatingChatbot } from '@/features/chat';
import { PageShell } from './PageShell';

const Content = ({ children }) => <PageShell>{children}</PageShell>;
const Chatbot = () => <FloatingChatbot />;

export const AppPageLayout = ({ children }) => <>{children}</>;

AppPageLayout.Content = Content;
AppPageLayout.Chatbot = Chatbot;

export default AppPageLayout;
