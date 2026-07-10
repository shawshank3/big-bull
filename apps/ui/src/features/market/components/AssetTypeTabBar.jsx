// Tier 2 — Prop-Based Component

/**
 * AssetTypeTabBar
 *
 * A purely presentational tab strip that controls the active asset-type filter.
 * No data fetching — fully driven by props.
 *
 * @param {object}   props
 * @param {Array<{ label: string, value: string }>} props.tabs    - Tab definitions
 * @param {string}   props.activeValue  - Currently selected tab value
 * @param {Function} props.onChange     - Called with the tab value when a tab is clicked
 */
export const AssetTypeTabBar = ({ tabs, activeValue, onChange }) => (
  <div className="flex gap-2 border-b border-border pb-0 mb-6" role="tablist">
    {tabs.map(({ label, value }) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={activeValue === value}
        onClick={() => onChange(value)}
        className={[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeValue === value
            ? 'border-primary text-primary'
            : 'border-transparent text-muted hover:text-foreground',
        ].join(' ')}
      >
        {label}
      </button>
    ))}
  </div>
);

export default AssetTypeTabBar;
