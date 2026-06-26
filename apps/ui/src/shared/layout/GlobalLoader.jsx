export const GlobalLoader = ({ show, label }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg/80 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      aria-label={label}
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
