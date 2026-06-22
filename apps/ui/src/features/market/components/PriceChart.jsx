/**
 * PriceChart
 *
 * Compound-style card component that wraps the shared LineChart for use on
 * stock and mutual fund detail pages.  Renders a range-selector tab strip,
 * fetches chart data via RTK Query, and handles loading / error / empty states
 * — all following the existing MarketQuoteCard compound-component pattern.
 *
 * Usage (stock):
 *   <PriceChart ticker="RELIANCE" assetType="STOCK" currentPrice={3200} />
 *
 * Usage with custom header slot (replaces "Price History" title):
 *   <PriceChart ticker="RELIANCE" assetType="STOCK" currentPrice={3200} header={<MyHeader />} />
 *
 * Usage (mutual fund):
 *   <PriceChart ticker="120503" assetType="MUTUAL_FUND" currentPrice={98.5} />
 *
 * Constraints honoured:
 *   - 1D for STOCK     → 30-second intraday points (granularity: '30s')
 *   - 1D for MF        → single daily NAV point (flat line / minimal data msg)
 *   - 1W/1M/3M/1Y      → daily closing prices for both types
 *   - No writes; purely a read/display component.
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { LineChart } from '@/shared/ui/line-chart';
import { formatCurrency } from '@/shared/utils';
import { useGetChartQuery } from '../api/marketApi';
import { ASSET_TYPES, CHART_RANGES } from '@/shared/constants';

// ─── Range options ────────────────────────────────────────────────────────────

const STOCK_RANGES = [
  CHART_RANGES.ONE_DAY,
  CHART_RANGES.ONE_WEEK,
  CHART_RANGES.ONE_MONTH,
  CHART_RANGES.THREE_MONTHS,
  CHART_RANGES.ONE_YEAR,
];
const MF_RANGES = [
  CHART_RANGES.ONE_WEEK,
  CHART_RANGES.ONE_MONTH,
  CHART_RANGES.THREE_MONTHS,
  CHART_RANGES.ONE_YEAR,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const deriveColor = (points) => {
  if (!points || points.length < 2) return 'neutral';
  const first = points[0].price;
  const last = points[points.length - 1].price;
  if (last > first) return 'up';
  if (last < first) return 'down';
  return 'neutral';
};

const getPriceDelta = (points) => {
  if (!points || points.length < 2) return null;
  const first = points[0].price;
  const last = points[points.length - 1].price;
  const delta = last - first;
  const pct = first > 0 ? (delta / first) * 100 : 0;
  return { delta, pct, up: delta >= 0 };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RangeTabs = ({ ranges, selected, onChange }) => (
  <Tabs value={selected} onValueChange={onChange}>
    <TabsList>
      {ranges.map((r) => (
        <TabsTrigger key={r} value={r} className="text-xs px-3">
          {r}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

export const DeltaBadge = ({ delta, pct, up }) => {
  const Icon = up ? TrendingUp : delta === 0 ? Minus : TrendingDown;
  const colorClass = up ? 'text-success' : delta === 0 ? 'text-muted' : 'text-danger';
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${colorClass}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? '+' : ''}
      {formatCurrency(delta)} ({up ? '+' : ''}
      {pct.toFixed(2)}%)
    </span>
  );
};

const ChartLoading = () => (
  <div className="flex items-center justify-center py-10">
    <Spinner label="Loading chart…" className="py-2" />
  </div>
);

const ChartError = () => (
  <Alert variant="danger" className="my-2">
    Unable to load chart data. Try again shortly.
  </Alert>
);

const ChartEmpty = ({ range, assetType }) => {
  const msg =
    assetType === ASSET_TYPES.MUTUAL_FUND && range === CHART_RANGES.ONE_DAY
      ? 'Intraday chart is not available for mutual funds. Select 1W or longer.'
      : `No chart data available for the ${range} range yet. Data builds up as the simulation runs.`;
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-1">
      <Minus className="h-8 w-8 text-muted mb-2" aria-hidden />
      <p className="text-sm text-muted max-w-xs">{msg}</p>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {string}      ticker
 * @param {string}      assetType   'STOCK' | 'MUTUAL_FUND'
 * @param {number}      currentPrice
 * @param {ReactNode}   [header]    Optional slot — replaces the default
 *                                  "Price History" title when provided.
 *                                  The range-tab strip is always rendered
 *                                  on the trailing edge regardless.
 */
export const PriceChart = ({ ticker, assetType, currentPrice, header }) => {
  const isMF = assetType === ASSET_TYPES.MUTUAL_FUND;
  const ranges = isMF ? MF_RANGES : STOCK_RANGES;
  const [range, setRange] = useState(isMF ? CHART_RANGES.ONE_WEEK : CHART_RANGES.ONE_DAY);

  const {
    data: chart,
    isLoading,
    isError,
    isFetching,
  } = useGetChartQuery({ ticker, range }, { skip: !ticker });

  const points = chart?.points ?? [];
  const granularity = chart?.granularity ?? (range === '1D' ? '30s' : 'daily');
  const color = deriveColor(points);
  const delta = getPriceDelta(points);
  const hasData = points.length >= 2;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Leading: custom header slot or fallback "Price History" + delta */}
          <div className="flex flex-col gap-0.5 min-w-0">
            {header ?? (
              <>
                <span className="text-base font-bold">Price History</span>
                {!isLoading && !isError && delta && <DeltaBadge {...delta} />}
              </>
            )}
          </div>
          {/* Trailing: range tabs always present */}
          <RangeTabs ranges={ranges} selected={range} onChange={setRange} />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {(isLoading || isFetching) && <ChartLoading />}
        {!isLoading && isError && <ChartError />}
        {!isLoading && !isError && !hasData && <ChartEmpty range={range} assetType={assetType} />}
        {!isLoading && !isError && hasData && (
          <LineChart points={points} color={color} granularity={granularity} height={220} />
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
