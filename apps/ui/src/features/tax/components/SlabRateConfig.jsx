import { useState } from 'react';
import { Settings2, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover';
import { cn } from '@/lib/utils';
import { useSlabRate, INTRADAY_SLAB_RATES } from '../hooks/useSlabRate';

/**
 * SlabRateConfig — Settings icon that opens a popover for the user to select
 * their income tax slab rate, used to estimate tax on intraday (speculative)
 * business income under Section 43(5).
 *
 * Uses inline radio buttons instead of a nested <Select> to avoid
 * Radix portal-inside-portal z-index/overflow conflicts.
 */
export const SlabRateConfig = () => {
  const { slabRate, setSlabRate, slabRateLabel } = useSlabRate();
  const [open, setOpen] = useState(false);
  const [pendingRate, setPendingRate] = useState(slabRate);

  const handleOpenChange = (next) => {
    if (next) setPendingRate(slabRate);
    setOpen(next);
  };

  const handleApply = () => {
    setSlabRate(pendingRate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Configure income tax slab rate"
          title="Configure your income tax slab rate"
          className="px-2"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72">
        <p className="text-sm font-medium mb-1">Income Tax Slab Rate</p>
        <p className="text-xs text-muted-foreground mb-3">
          Used to estimate tax on intraday (speculative) income under Section 43(5). Intraday
          profits are taxed at your applicable income slab rate — not a flat rate.
        </p>

        {/* Inline slab options — avoids nested portal issues */}
        <div
          className="flex flex-col gap-1 mb-3"
          role="radiogroup"
          aria-label="Select tax slab rate"
        >
          {INTRADAY_SLAB_RATES.map((slab) => {
            const isSelected = pendingRate === slab.value;
            return (
              <button
                key={slab.value}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setPendingRate(slab.value)}
                className={cn(
                  'flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-left transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/10 text-foreground'
                )}
              >
                <span>
                  {slab.label}
                  {slab.value === 0.3 && (
                    <span className="ml-1 text-xs text-muted-foreground">(default — highest)</span>
                  )}
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        <Button size="sm" className="w-full" onClick={handleApply}>
          Apply
        </Button>

        <p className="text-xs text-muted-foreground mt-2">
          Current: <span className="font-medium">{slabRateLabel}</span>
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default SlabRateConfig;
