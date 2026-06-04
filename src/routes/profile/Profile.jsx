import { AppPageLayout } from '../../components/layout';
import { ProfileContent } from '../../components/profile';

export const Profile = () => {
  return (
    <AppPageLayout>
      <AppPageLayout.Content>
        <ProfileContent />
      </AppPageLayout.Content>
    </AppPageLayout>
  );
};

export default Profile;
