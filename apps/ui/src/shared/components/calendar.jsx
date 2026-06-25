// Tier 2 — Prop-Based Component
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '@/lib/utils';

/**
 * Calendar — shadcn-style wrapper around react-day-picker (v10).
 *
 * Forwards all DayPicker props (mode, selected, onSelect, numberOfMonths,
 * defaultMonth, disabled, etc.) so callers control selection behaviour.
 *
 * Theming notes
 * ─────────────
 * The package's default stylesheet uses `--rdp-range_middle-color: inherit`
 * and a hard-coded light `--rdp-accent-background-color`. In a dark theme
 * that produces white-on-white middle days. We override the relevant CSS
 * variables so the range tint and middle-day text follow the BigBull theme
 * tokens and stay legible in both light and dark mode.
 */
const Calendar = React.forwardRef(({ className, classNames, ...props }, ref) => (
  <DayPicker
    ref={ref}
    className={cn(
      'p-2',
      // Theme overrides: keep the accent/range colours aligned with the
      // BigBull palette and ensure the range-middle text contrasts against
      // the tinted background in both light and dark modes.
      '[--rdp-accent-color:var(--primary)]',
      '[--rdp-accent-background-color:color-mix(in_srgb,var(--primary)_20%,transparent)]',
      '[--rdp-range_middle-color:var(--foreground)]',
      '[--rdp-today-color:var(--primary)]',
      className
    )}
    classNames={classNames}
    {...props}
  />
));
Calendar.displayName = 'Calendar';

export { Calendar };
