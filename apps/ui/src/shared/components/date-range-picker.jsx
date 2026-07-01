// Tier 2 — Prop-Based Component
import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

/**
 * DateRangePicker
 *
 * Shadcn-style date range picker built on Popover + Calendar (react-day-picker).
 * Controlled component — the parent owns the {from, to} value and is notified
 * via onChange whenever the user picks a new range or clears it.
 *
 * Behaviour notes
 * ───────────────
 * • Single-day range: clicking the same day twice (after picking it as the
 *   range start) is supported natively by react-day-picker — it sets
 *   `from === to`. No extra wiring needed here.
 * • Auto-close: once both `from` and `to` are selected, the popover closes
 *   automatically so the user does not need an extra click to dismiss it.
 *
 * @param {Object} props
 * @param {{from?: Date, to?: Date} | undefined} props.value - Selected range
 * @param {(range: {from?: Date, to?: Date} | undefined) => void} props.onChange
 * @param {string} [props.placeholder='Pick a date range']
 * @param {string} [props.className] - Wrapper classes for the trigger
 * @param {string} [props.align='end'] - Popover alignment
 * @param {number} [props.numberOfMonths=2] - Months shown side-by-side
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  align = 'end',
  numberOfMonths,
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  // On mobile show a single month to prevent horizontal overflow.
  // Callers can still override by passing numberOfMonths explicitly.
  const months = numberOfMonths ?? (isMobile ? 1 : 2);

  const hasRange = Boolean(value?.from);

  const label = React.useMemo(() => {
    if (!value?.from) return placeholder;
    if (value.to) {
      return `${format(value.from, 'dd MMM yyyy')} – ${format(value.to, 'dd MMM yyyy')}`;
    }
    return format(value.from, 'dd MMM yyyy');
  }, [value, placeholder]);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 justify-start gap-2 px-3 font-normal',
            !hasRange && 'text-muted',
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
          {hasRange && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date range"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-2">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={months}
          defaultMonth={value?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
