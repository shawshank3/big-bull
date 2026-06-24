/**
 * Educational tooltip content for tax concepts.
 * These can be consumed by any Tooltip component across the Tax feature.
 */

export const TAX_TOOLTIPS = {
  stcg: {
    title: 'Short-Term Capital Gains (STCG)',
    content:
      'Gains on assets held for less than 12 months. Taxed at 20% flat rate under current Indian tax rules.',
  },
  ltcg: {
    title: 'Long-Term Capital Gains (LTCG)',
    content:
      'Gains on assets held for 12 months or more. Taxed at 12.5% on gains exceeding ₹1,25,000 exemption per financial year.',
  },
  fifo: {
    title: 'FIFO Method',
    content:
      'First In, First Out — when you sell, the oldest purchased units are matched first. This determines your cost basis and holding period for tax classification.',
  },
  offsetRules: {
    title: 'Loss Offset Rules',
    content:
      'Short-term losses can offset both STCG and LTCG. Long-term losses can only offset LTCG. Unabsorbed losses can be carried forward for up to 8 assessment years.',
  },
  harvesting: {
    title: 'Tax-Loss Harvesting',
    content:
      'A strategy to sell losing investments to realize losses that can offset your taxable gains, reducing your overall tax liability for the financial year.',
  },
};

/**
 * EducationalTooltip — Renders a tooltip trigger with educational content.
 * Use when a Tooltip/Popover wrapper component is available.
 */
export const EducationalTooltip = ({ tooltipKey, children }) => {
  const tooltip = TAX_TOOLTIPS[tooltipKey];
  if (!tooltip) return children ?? null;

  return (
    <span className="inline-flex items-center gap-1 group relative" title={tooltip.content}>
      {children}
      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-border text-xs text-muted cursor-help">
        ?
      </span>
    </span>
  );
};

export default EducationalTooltip;
