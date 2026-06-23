// Tier 1 — Presentational Token
export const GrowingMarketIcon = ({ className = '', size = 36 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    width={size}
    height={size}
    className={className}
    aria-label="Growing market chart"
    role="img"
  >
    <rect width="40" height="40" rx="10" fill="currentColor" />
    <rect x="7" y="22" width="4" height="10" rx="1" fill="#fff" opacity="0.4" />
    <line x1="9" y1="19" x2="9" y2="22" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
    <line x1="9" y1="32" x2="9" y2="35" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
    <rect x="15" y="15" width="4" height="12" rx="1" fill="#fff" opacity="0.7" />
    <line x1="17" y1="11" x2="17" y2="15" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.7" />
    <line x1="17" y1="27" x2="17" y2="30" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.7" />
    <rect x="23" y="10" width="4" height="13" rx="1" fill="#fff" opacity="0.9" />
    <line x1="25" y1="7" x2="25" y2="10" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.9" />
    <line x1="25" y1="23" x2="25" y2="26" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.9" />
    <polyline
      points="6,31 14,22 22,18 32,9"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.95"
    />
    <polyline
      points="27,8 32,9 31,14"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.95"
    />
  </svg>
);

export default GrowingMarketIcon;
