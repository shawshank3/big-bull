import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useThreshold } from '../hooks/useThreshold';

/**
 * ThresholdConfig — Settings gear icon that opens a popover to configure
 * the minimum loss threshold (₹) for filtering harvesting opportunities.
 */
export const ThresholdConfig = () => {
  const { threshold, setThreshold } = useThreshold();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(threshold));
  const [popoverStyle, setPopoverStyle] = useState({});
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Sync input value when threshold changes externally
  useEffect(() => {
    if (!open) setInputValue(String(threshold));
  }, [threshold, open]);

  // Position the popover within viewport bounds
  const updatePosition = useCallback(() => {
    if (!open || !buttonRef.current || !popoverRef.current) return;

    const btnRect = buttonRef.current.getBoundingClientRect();
    const popover = popoverRef.current;
    const popoverWidth = popover.offsetWidth;
    const viewportWidth = window.innerWidth;
    const gap = 8; // mt-2 equivalent

    // Default: align right edge of popover with right edge of button
    let right = 0;

    // Check if popover overflows left side of viewport
    const popoverLeft = btnRect.right - popoverWidth;
    if (popoverLeft < 16) {
      // Shift popover so its left edge is at least 16px from viewport left
      right = popoverLeft - 16;
    }

    // Check if popover overflows right side of viewport
    const popoverRight = btnRect.right - right;
    if (popoverRight > viewportWidth - 16) {
      right = btnRect.right - (viewportWidth - 16);
    }

    setPopoverStyle({ right: `${right}px`, top: `calc(100% + ${gap}px)` });
  }, [open]);

  useEffect(() => {
    updatePosition();
    if (!open) return;
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open, updatePosition]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Configure threshold"
        title="Configure minimum loss threshold"
        className="px-2"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-[100] w-64 rounded-lg border border-border bg-surface p-4 shadow-lg"
          style={popoverStyle}
        >
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
        </div>
      )}
    </div>
  );
};

export default ThresholdConfig;
