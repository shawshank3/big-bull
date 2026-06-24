import { useLogoutMutation } from '@/features/auth/api/authApi';

export const GlobalLoader = ({ show, label }) => {
  const [, { isLoading: isLoggingOut }] = useLogoutMutation({
    fixedCacheKey: 'global-logout',
  });
  const visible = show ?? isLoggingOut;

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg/80 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      aria-label={label ?? 'Signing out…'}
    >
      <div className="animate-pulse">
        <img
          src="/growing-market-icon.png"
          alt=""
          aria-hidden="true"
          className="h-16 w-16 rounded-lg object-cover"
        />
      </div>
      <p className="text-sm font-medium text-muted">{label ?? 'Signing out…'}</p>
    </div>
  );
};

export default GlobalLoader;
