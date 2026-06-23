// Tier 1 — Presentational Token
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Spinner = ({ className, label = 'Loading' }) => (
  <div
    className={cn('flex flex-col items-center gap-2 py-8', className)}
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
    {label ? <p className="text-sm text-muted">{label}</p> : null}
  </div>
);

export default Spinner;
