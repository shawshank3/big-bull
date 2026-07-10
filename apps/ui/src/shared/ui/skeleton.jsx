import { cn } from '@/lib/utils';

/**
 * Skeleton
 * Generic shimmer placeholder for loading states.
 * Accepts className to control size and shape.
 */
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn('animate-pulse rounded-md bg-muted/20 dark:bg-white/10', className)}
    aria-hidden="true"
    {...props}
  />
);

export default Skeleton;
