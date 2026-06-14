import { MARKET_FACTS } from './constants';

const StatCard = ({ icon: Icon, label, value, note }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" aria-hidden />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted">{note}</p>
    </div>
  </div>
);

export const MarketStats = () => (
  <section>
    <h2 className="mb-6 text-xl font-semibold text-foreground">Market at a glance</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {MARKET_FACTS.map((fact) => (
        <StatCard key={fact.label} {...fact} />
      ))}
    </div>
  </section>
);

export default MarketStats;
