import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover';
import { useThreshold } from '../hooks/useThreshold';

/**
 * ThresholdConfig — Settings gear icon that opens a popover to configure
 * the minimum loss threshold (₹) for filtering harvesting opportunities.
 */
export const ThresholdConfig = () => {
  const { threshold, setThreshold } = useThreshold();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(threshold));

  // Sync input when popover opens
  const handleOpenChange = (next) => {
    if (next) setInputValue(String(threshold));
    setOpen(next);
  };

  const handleApply = () => {
    const num = Number(inputValue);
    if (Number.isFinite(num) && num >= 0) {
      setThreshold(num);
    }
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Configure threshold"
          title="Configure minimum loss threshold"
          className="px-2"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent>
        <p className="text-sm font-medium mb-2">Minimum Loss Threshold</p>
        <p className="text-xs text-muted-foreground mb-3">
          Only show opportunities with unrealized loss above this amount.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input
            type="number"
            min="0"
            step="100"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 flex-1"
            placeholder="0"
          />
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
        {threshold > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Current: ₹{threshold.toLocaleString('en-IN')}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ThresholdConfig;
