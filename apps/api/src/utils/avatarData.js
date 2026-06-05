const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB decoded

const validateAvatarData = (avatar) => {
  if (!avatar || typeof avatar !== 'string') {
    return { error: 'Please provide an image' };
  }

  const match = avatar.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!match) {
    return { error: 'Invalid image format. Use JPEG, PNG, WebP, or GIF.' };
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIMES.includes(mime)) {
    return { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_BYTES) {
    return { error: 'Image must be 2MB or smaller' };
  }

  return { avatar };
};

module.exports = { validateAvatarData };
