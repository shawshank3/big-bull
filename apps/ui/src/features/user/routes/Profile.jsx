import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { ProfileContent } from '../components';

export const Profile = () => (
  <AppPageLayout>
    <AppPageLayout.Content>
      <ProfileContent />
    </AppPageLayout.Content>
  </AppPageLayout>
);

export default Profile;
