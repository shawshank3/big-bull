import { useState } from 'react';
import { Camera } from 'lucide-react';
import { MutedText } from '../ui/typography';
import { cn } from '@/lib/utils';
import { PhotoUploadModal } from './PhotoUploadModal';
import { UserAvatar } from './UserAvatar';

export const ProfilePhotoSection = ({ profile }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  if (!profile) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative shrink-0">
          <UserAvatar
            name={profile.name}
            avatar={profile.avatar}
            className="h-20 w-20"
            fallbackClassName="text-2xl"
          />
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            aria-label="Change profile photo"
            className={cn(
              'absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full',
              'border-2 border-bg bg-primary text-white shadow-md',
              'transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
            )}
          >
            <Camera className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-foreground">{profile.name}</p>
          <MutedText>{profile.email}</MutedText>
        </div>
      </div>

      <PhotoUploadModal profile={profile} open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
};

export default ProfilePhotoSection;
