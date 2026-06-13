import { cn } from '@/lib/utils';
import { FEATURE_HIGHLIGHTS } from './constants';

const FeatureCard = ({ title, description, gradient, iconBg, icon }) => (
  <div
    className={cn(
      'flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br p-6',
      gradient
    )}
  >
    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-xl', iconBg)}>
      {icon}
    </div>
    <div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  </div>
);

export const FeatureHighlights = () => (
  <section>
    <h2 className="mb-6 text-xl font-semibold text-foreground">Everything you need</h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {FEATURE_HIGHLIGHTS.map((f) => (
        <FeatureCard key={f.title} {...f} />
      ))}
    </div>
  </section>
);

export default FeatureHighlights;
