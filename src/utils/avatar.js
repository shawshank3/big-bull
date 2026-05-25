/**
 * Avatar is stored in MongoDB as a base64 data URL and used directly in <img src>.
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (
    avatar.startsWith('data:') ||
    avatar.startsWith('blob:') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://')
  ) {
    return avatar;
  }
  return null;
};

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

export default getAvatarUrl;
