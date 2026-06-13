import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from '../common';
import { MutedText } from '../ui/typography';
import { useRemoveAvatarMutation, useUploadAvatarMutation } from '../../api/authApi';
import { getAvatarUrl, readFileAsDataUrl } from './utils';
import { UserAvatar } from './UserAvatar';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 2;

export const PhotoUploadModal = ({ profile, open, onClose }) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: isRemoving }] = useRemoveAvatarMutation();

  const isBusy = isUploading || isRemoving;
  const savedAvatarUrl = getAvatarUrl(profile?.avatar);
  const modalPreview = previewUrl || savedAvatarUrl;
  const hasSavedAvatar = Boolean(profile?.avatar);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isBusy) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, isBusy, onClose]);

  const resetModalState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isBusy) return;
    resetModalState();
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setLocalError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Please choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`Image must be ${MAX_SIZE_MB}MB or smaller.`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setLocalError('Choose a new photo to upload.');
      return;
    }

    try {
      const avatar = await readFileAsDataUrl(selectedFile);
      await uploadAvatar({ avatar }).unwrap();
      resetModalState();
      onClose();
    } catch (err) {
      setLocalError(err?.data?.message || err?.message || 'Failed to upload photo');
    }
  };

  const handleRemove = async () => {
    try {
      await removeAvatar().unwrap();
      resetModalState();
      onClose();
    } catch (err) {
      setLocalError(err?.data?.message || 'Failed to remove photo');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-upload-title"
        className="w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="photo-upload-title" className="text-lg font-bold text-foreground">
          Profile photo
        </h2>
        <MutedText className="mt-1">Max {MAX_SIZE_MB}MB · JPEG, PNG, WebP, or GIF</MutedText>

        <div className="mt-6 flex justify-center">
          <UserAvatar
            name={profile?.name}
            avatar={modalPreview}
            className="h-32 w-32"
            fallbackClassName="text-4xl"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          >
            Choose photo
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleUpload}
            loading={isUploading}
            disabled={isBusy || !selectedFile}
          >
            {isUploading ? 'Uploading…' : 'Save photo'}
          </Button>
          {hasSavedAvatar ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              loading={isRemoving}
              disabled={isBusy}
            >
              Remove
            </Button>
          ) : null}
        </div>

        {selectedFile ? (
          <p className="mt-2 text-center text-sm text-muted">{selectedFile.name}</p>
        ) : null}
        {localError ? (
          <Alert variant="danger" className="mt-4">
            {localError}
          </Alert>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
